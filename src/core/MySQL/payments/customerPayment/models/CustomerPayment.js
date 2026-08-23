import { db } from "../../../../../database/MySQL/MySQL.js";

export class CustomerPayment {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        account_receivable_id,
        payment_method_id,
        cash_opening_id,
        user_id,
        amount,
        payment_date,
        reference,
        notes,
      } = this;

      const paymentAmount = Number(amount);
      if (paymentAmount <= 0)
        throw new Error("El valor del pago debe ser mayor que cero");

      const [accountRows] = await connection.execute(
        `
                SELECT *
                FROM accounts_receivable
                WHERE id = ?
                AND company_id = ?
                AND status IN('pending','partial','overdue')
                LIMIT 1
                FOR UPDATE
                `,
        [account_receivable_id, company_id],
      );

      if (!accountRows.length)
        throw new Error("La cuenta por cobrar no existe o no admite pagos");

      const account = accountRows[0];

      if (paymentAmount > Number(account.pending_amount))
        throw new Error("El pago no puede superar el saldo pendiente");

      const [methodRows] = await connection.execute(
        `
                SELECT *
                FROM payment_methods
                WHERE id = ?
                AND company_id = ?
                AND active = true
                LIMIT 1
                `,
        [payment_method_id, company_id],
      );

      if (!methodRows.length)
        throw new Error("Metodo de pago invalido o inactivo");

      const paymentMethod = methodRows[0];

      if (cash_opening_id && paymentMethod.name?.toLowerCase() === "efectivo") {
        const [openingRows] = await connection.execute(
          `
                    SELECT id
                    FROM cash_openings
                    WHERE id = ?
                    AND company_id = ?
                    AND status = 'open'
                    LIMIT 1
                    `,
          [cash_opening_id, company_id],
        );

        if (!openingRows.length)
          throw new Error("La caja indicada no tiene apertura activa");
      }

      const [paymentResult] = await connection.execute(
        `
                INSERT INTO customer_payments
                (
                    company_id,
                    account_receivable_id,
                    customer_id,
                    payment_method_id,
                    cash_opening_id,
                    user_id,
                    amount,
                    payment_date,
                    reference,
                    notes
                )
                VALUES(?,?,?,?,?,?,?,?,?,?)
                `,
        [
          company_id,
          account_receivable_id,
          account.customer_id,
          payment_method_id,
          cash_opening_id || null,
          user_id || null,
          paymentAmount,
          payment_date || new Date(),
          reference || null,
          notes || null,
        ],
      );

      const payment_id = paymentResult.insertId;
      const newPaidAmount = Number(account.paid_amount) + paymentAmount;
      const newPendingAmount = Number(account.original_amount) - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? "paid" : "partial";

      await connection.execute(
        `
                UPDATE accounts_receivable
                SET
                    paid_amount = ?,
                    pending_amount = ?,
                    status = ?
                WHERE id = ?
                AND company_id = ?
                `,
        [
          newPaidAmount,
          Math.max(0, newPendingAmount),
          newStatus,
          account_receivable_id,
          company_id,
        ],
      );

      // Solo register si entra por apertura de caja
      if (cash_opening_id) {
        await connection.execute(
          `
                    INSERT INTO cash_movements
                    (
                        company_id,
                        cash_opening_id,
                        user_id,
                        movement_type,
                        category,
                        amount,
                        description,
                        reference_type,
                        reference_id,
                        movement_date
                    )
                    VALUES(?,?,?,'income','receivable_payment', ?,?, 'CUSTOMER_PAYMENT',?,?)
                    `,
          [
            company_id,
            cash_opening_id,
            user_id || null,
            paymentAmount,
            `Pago de cuenta por cobrar #${account_receivable_id}`,
            payment_id,
            payment_date || new Date(),
          ],
        );
      }

      await connection.commit();
      return await CustomerPayment.findById(payment_id, company_id);
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
        cp.*,
        c.first_name AS customer_name,
        pm.name AS payment_method_name
      FROM customer_payments cp
      INNER JOIN customers c
        ON c.id = cp.customer_id
      INNER JOIN payment_methods pm
        ON pm.id = cp.payment_method_id
      WHERE cp.id = ?
      AND cp.company_id = ?
      LIMIT 1
        `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findByAccount(account_receivable_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        cp.*,
        pm.name AS payment_method_name
      FROM customer_payments cp
      INNER JOIN payment_methods pm
        ON pm.id = cp.payment_method_id
      WHERE cp.account_receivable_id = ?
      AND cp.company_id = ?
      AND cp.status = 'completed'
      ORDER BY cp.payment_date ASC
        `,
      [account_receivable_id, company_id],
    );
    return rows;
  }

  static async findByCustomer(customer_id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM customer_payments
        WHERE customer_id = ? 
        AND company_id = ?
        ORDER BY payment_date DESC
        `,
      [customer_id, company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM customer_payments
        WHERE company_id = ?
        `,
      [company_id],
    );
    return rows[0].total;
  }
}
