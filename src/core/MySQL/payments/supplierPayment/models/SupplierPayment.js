import { concurrency } from "sharp";
import { db } from "../../.../../../../../database/MySQL/MySQL.js";

export class SupplierPayment {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        account_payable_id,
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
        FROM accounts_payable
        WHERE id = ?
        AND company_id = ?
        AND status IN ('pending', 'partial', 'overdue')
        LIMIT 1
        FOR UPDATE
        `,
        [account_payable_id, company_id],
      );

      if (!accountRows.length)
        throw new Error("La cuenta por pagar no existe o no admite pagos");

      const account = accountRows[0];

      if (paymentAmount > Number(account.payment_amoung))
        throw new Error("El pago no puede superar el saldo pendiente");

      const [methodRows] = await connection.execute(
        `
        SELECT *
        FROM payment_methods
        WHERE id = ?
        AND company_id = ?
        AND status = 'active'
        LIMIT 1
        `,
        [payment_method_id, company_id],
      );

      if (!methodRows.length)
        throw new Error("Metodo de pago invalido o inactivo");

      if (cash_opening_id) {
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
          throw new Error("La caja indicada no tiene una apertura activa");
      }

      const [paymentResult] = await connection.execute(
        `
        INSERT INTO supplier_payments
        (
          company_id,
          account_payable_id,
          supplier_id,
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
          account_payable_id,
          supplier_id,
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
        UPDATE accounts_payable
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
          account_payable_id,
          company_id,
        ],
      );

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
          VALUES(?, ?, ?, 'expense', 'payable_payment', ?, ?, 'SUPPLIER_PAYMENT', ?, ?)
          `,
          [
            company_id,
            cash_opening_id,
            user_id || null,
            paymentAmount,
            `Pago de cuenta por pagar #${account_payable_id}`,
            payment_id,
            payment_date || new Date(),
          ],
        );
      }

      await connection.commit();

      return await SupplierPayment.findById(payment_id, company_id);
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
        sp.*,
        s.first_name AS supplier_name,
        pm.name AS payment_method_name
      FROM supplier_payments sp
      INNER JOIN suppliers s
        ON s.id = sp.supplier_id
      INNER JOIN payment_methods pm
        ON pm.id = sp.payment_method_id
      WHERE sp.id = ?
      AND sp.company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findByAccount(account_payable_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        sp.*,
        pm.name AS payment_method_name
      FROM supplier_payments sp
      INNER JOIN payment_methods pm
        ON pm.id = sp.payment_method_id
      WHERE sp.account_payable_id = ?
      AND sp.company_id = ?
      AND sp.status = 'completed'
      ORDER BY sp.payment_date ASC
      `,
      [account_payable_id, company_id],
    );
    return rows;
  }

  static async findBySupplier(supplier_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM supplier_payments
      WHERE supplier_id = ?
      AND company_id = ?
      ORDER BY payment_date DESC
      `,
      [supplier_id, company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM supplier_payments
      WHERE company_id = ?
      `,
      [company_id],
    );
    return rows[0].total;
  }
}
