import { db } from "../../../../../database/MySQL/MySQL.js";

export class AccountReceivable {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        customer_id,
        reference_type,
        reference_id,
        issue_date,
        due_date,
        original_amount,
        notes,
      } = this;

      const amount = Number(original_amount);
      if (amount <= 0)
        throw new Error(
          "El valor de la cuenta por cobrar debe ser mayor que cero",
        );

      const [customerRows] = await connection.execute(
        `
                SELECT id
                FROM customers
                WHERE id = ?
                AND company_id = ?
                LIMIT 1
                `,
        [customer_id, company_id],
      );

      if (!customerRows.length)
        throw new Error("El cliente no existe para esta empresa");

      const [existingRows] = await connection.execute(
        `
                SELECT id
                FROM accounts_receivable
                WHERE company_id = ?
                AND reference_type = ?
                AND reference_id = ?
                AND status != 'cancelled'
                LIMIT 1
                `,
        [company_id, reference_type, reference_id],
      );

      if (existingRows.length)
        throw new Error("Ya existe una cuenta por cobrar para esta referencia");

      const [result] = await connection.execute(
        `
        INSERT INTO accounts_receivable
        (
          company_id,
          customer_id,
          reference_type,
          reference_id,
          issue_date,
          due_date,
          original_amount,
          paid_amount,
          pending_amount,
          status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                `,
        [
          company_id,
          customer_id,
          reference_type,
          reference_id,
          issue_date || new Date(),
          due_date || null,
          amount,
          0,
          amount,
          notes || null,
        ],
      );

      await connection.commit();
      return await AccountReceivable.findById(result.insertId, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        ar.*,
        c.first_name AS customer_name
      FROM accounts_receivable ar
      INNER JOIN customers c
        ON c.id = ar.customer_id
      WHERE ar.id = ?
      AND ar.company_id = ?
      LIMIT 1
        `,
      [id, company_id],
    );

    if (!rows.length) return null;
    return rows[0];
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            ar.*,
            c.first_name AS customer_name
        FROM accounts_receivable ar
        INNER JOIN customers c
            ON c.id = ar.customer_id
        WHERE ar.company_id = ?
        ORDER BY ar.id DESC
        `,
      [company_id],
    );
    return rows;
  }

  static async findByCustomer(customer_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM accounts_receivable
      WHERE customer_id = ?
      AND company_id = ?
      AND status IN ('pending', 'partial', 'overdue')
      ORDER BY due_date ASC, id ASC
        `,
      [customer_id, company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM accounts_receivable
        WHERE company_id = ?
        `,
      [company_id],
    );
    return rows[0].total;
  }

  static async updateOverdue(company_id) {
    const [result] = await db.execute(
      `
        UPDATE accounts_receivable
        SET status = 'overdue'
        WHERE company_id = ?
        AND due_date < CURDATE()
        AND pending_amount > 0
        AND status IN('pending','partial')
        `,
      [company_id],
    );
    return result;
  }

  static async cancel(id, company_id) {
    const [result] = await db.execute(
      `
        UPDATE accounts_receivable
        SET status = 'cancelled'
        WHERE id = ?
        AND company_id = ?
        AND paid_amount = 0
        AND status IN('pending','overdue')
        `,
      [id, company_id],
    );
    return result;
  }

  static async sumary(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN status != 'cancelled'
              THEN pending_amount
              ELSE 0
            END
          ),
          0
        ) AS total_pending,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'overdue'
              THEN pending_amount
              ELSE 0
            END
          ),
          0
        ) AS total_overdue,

        COUNT(
          CASE
            WHEN status IN ('pending', 'partial', 'overdue')
            THEN 1
          END
        ) AS open_accounts
      FROM accounts_receivable
      WHERE company_id = ?
        `,
      [company_id],
    );
    return {
      total_pending: Number(rows[0].total_pending),
      total_overdue: Number(rows[0].total_overdue),
      open_accounts: Number(rows[0].open_accounts),
    };
  }
}
