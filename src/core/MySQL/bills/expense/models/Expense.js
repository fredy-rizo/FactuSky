import { db } from "../../../../../database/MySQL/MySQL.js";

export class Expense {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const [result] = await db.execute(
      `
            INSERT INTO expenses
            (
                company_id,
                category_id,
                supplier_id,
                payment_method_id,
                cash_register_id,
                expense_number,
                description,
                expense_date,
                subtotal,
                tax,
                discount,
                total,
                status,
                payment_status,
                notes,
                user_id
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
      [
        this.company_id,
        this.category_id,
        this.supplier_id || null,
        this.payment_method_id || null,
        this.cash_register_id || null,
        this.expense_number,
        this.description,
        this.expense_date || new Date(),
        this.subtotal || 0,
        this.tax || 0,
        this.discount || 0,
        this.total || 0,
        this.status || "draft",
        this.payment_status || "pending",
        this.notes || null,
        this.user_id || null,
      ],
    );
    return await Expense.findById(result.insertId, this.company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                e.*,
                ec.name AS category_name
            FROM expenses e
            INNER JOIN expense_categories ec
                ON ec.id = e.category_id
            WHERE e.id = ?
            AND e.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                e.*,
                ec.name AS category_name
            FROM expenses e
            INNER JOIN expense_categories ec
                ON ec.id = e.category_id
            WHERE e.company_id = ?
            ORDER BY e.expense_date DESC, e.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async findByStatus(company_id, status) {
    const [rows] = await db.execute(
      `
            SELECT
                e.*,
                ec.name AS category_name
            FROM expenses e
            INNER JOIN expense_categories ec
                ON ec.id = e.category_id
            WHERE e.company_id = ?
            AND e.status = ?
            ORDER BY e.expense_date DESC
            `,
      [company_id, status],
    );
    return rows;
  }

  static async findPendingPayments(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                e.*,
                ec.name AS category_name
            FROM expenses e
            INNER JOIN expense_categories ec
                ON ec.id = e.category_id
            WHERE e.company_id = ?
            AND e.status = 'approved'
            AND e.payment_status = 'pending'
            ORDER BY e.expense_date ASC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS count
            FROM expenses
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const {
      category_id,
      supplier_id,
      payment_method_id,
      cash_register_id,
      description,
      expense_date,
      subtotal,
      tax,
      discount,
      total,
      notes,
    } = data;

    return await db.execute(
      `
            UPDATE expenses
            SET 
                category_id = ?,
                supplier_id = ?,
                payment_method_id = ?,
                cash_register_id = ?,
                description = ?,
                expense_date = ?,
                subtotal = ?,
                tax = ?,
                discount = ?,
                total = ?,
                notes = ?
            WHERE id = ?
            AND company_id = ?
            AND status = 'draft'
            `,
      [
        category_id,
        supplier_id || null,
        payment_method_id || null,
        cash_register_id || null,
        description,
        expense_date,
        subtotal,
        tax,
        discount,
        total,
        notes || null,
        id,
        company_id,
      ],
    );
  }

  static async approve(id, company_id, approved_by) {
    return await db.execute(
      `
            UPDATE expenses
            SET
                status = 'approved',
                approved_by = ?,
                approved_at = NOW()
            WHERE id = ?
            AND company_id = ?
            AND status = 'draft'
            `,
      [approved_by || null, id, company_id],
    );
  }

  static async cancel(id, company_id) {
    return await db.execute(
      `
            UPDATE expenses
            SET status = 'cancelled'
            WHERE id = ?
            AND company_id = ?
            AND status IN ('draft', 'approved')
            AND payment_status = 'pending'
            `,
      [id, company_id],
    );
  }

  static async pay({
    id,
    company_id,
    cash_register_id,
    payment_method_id,
    paid_by,
  }) {
    const connection = await db.getConnection();

    try {
      const [expenseRows] = await connection.execute(
        `
                SELECT *
                FROM expenses
                WHERE id = ?
                AND company_id = ?
                LIMIT 1
                FOR UPDATE
                `,
        [id, company_id],
      );

      if (!expenseRows.length) throw new Error("Gasto no encontrado");

      const expense = expenseRows[0];

      if (expense.status !== "approved")
        throw new Error("El gasto debe estar aprobado antes de pagarse");

      if (expense.payment_status === "paid")
        throw new Error("Este gasto ya fue pagado");

      if (!cash_register_id)
        throw new Error("La caja es requerida para registrar el pago");

      const [cashRows] = await connection.execute(
        `
                SELECT *
                FROM cash_registers
                WHERE id = ?
                AND company_id = ?
                AND status = 'open'
                LIMIT 1
                FOR UPDATE
                `,
        [cash_register_id, company_id],
      );

      if (!cashRows.length)
        throw new Error("La caja no existe o no esa abierta");

      const cashRegister = cashRows[0];
      const amount = Number(expense.total);
      const currentBalance = Number(cashRegister.current_balance);

      if (currentBalance < amount)
        throw new Error(
          "La caja no tiene saldo suficiente para pagar este gasto",
        );

      const [movementResult] = await connection.execute(
        `
                INSERT INTO cash_movements
                (
                    company_id,
                    cash_register_id,
                    type,
                    amount,
                    description,
                    reference_type,
                    reference_id,
                    payment_method_id,
                    user_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
        [
          company_id,
          cash_register_id,
          "expense",
          amount,
          `Pago de gasto ${expense.expense_number}`,
          "expense",
          expense.id,
          payment_method_id || expense.payment_method_id || null,
          paid_by || null,
        ],
      );

      const cash_movement_id = movementResult.insertId;

      await connection.execute(
        `
                UPDATE cash_registers
                SET
                    current_balance =
                        current_balance - ?
                WHERE id = ?
                AND company_id = ?
                AND status = 'open'
                `,
        [amount, cash_movement_id, company_id],
      );

      await connection.execute(
        `
                UPDATE expenses
                SET
                    payment_status = 'paid',
                    paid_by = ?,
                    paid_at = NOW(),
                    cash_register_id = ?,
                    payment_method_id = ?,
                    cash_movement_id = ?
                WHERE id = ?
                AND company_id = ?
                AND status = 'approved'
                AND payment_status = 'pending'
                `,
        [
          paid_by || null,
          cash_register_id,
          payment_method_id || expense.payment_method_id || null,
          cash_movement_id,
          id,
          company_id,
        ],
      );

      await connection.commit();
      return await Expense.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async markAsPaid(id, company_id, paid_by, cash_movement_id) {
    return await db.execute(
      `
      UPDATE expenses
      SET
        payment_status = 'paid',
        paid_by = ?,
        paid_at = NOW(),
        cash_movement_id = ?
      WHERE id = ?
      AND company_id = ?
      AND status = 'approved'
      AND payment_status = 'pending'
      `,
      [paid_by || null, cash_movement_id || null, id, company_id],
    );
  }

  static async totals(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        COALESCE(SUM(total), 0) AS total_expenses,
        COALESCE(
          SUM(
            CASE
              WHEN status = 'approved'
              AND payment_status = 'paid'
              THEN total
              ELSE 0
            END
          ),
          0
        ) AS total_paid,
        
        COALESCE(
          SUM(
            CASE
              WHEN status = 'approved'
              AND payment_status = 'pending'
              THEN total
              ELSE 0
            END
          ),
          0
        ) AS total_pending
      FROM expenses
      WHERE company_id = ?
      AND status != 'cancelled'
      `,
      [company_id],
    );
    return rows[0];
  }

  static async totalsByCategory(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        ec.id AS cateogory_id,
        ec.name AS category_name,
        COUNT(e.id) AS expenses_count,
        COALESCE(SUM(e.total), 0) AS total
      FROM expenses e
      INNER JOIN expense_categories ec
        ON ec.id = e.category_id
      WHERE e.company_id = ?
      AND e.status != 'cancelled'
      GROUP BY
        ec.id,
        ec.name
      ORDER BY total DESC
      `,
      [company_id],
    );
    return rows;
  }
}
