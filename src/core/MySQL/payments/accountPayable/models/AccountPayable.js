import { db } from "../../../../../database/MySQL/MySQL.js";

export class AccountPayable {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        supplier_id,
        reference_type,
        reference_id,
        issue_date,
        due_date,
        original_amount,
        notes,
      } = notes;

      const amount = Number(original_amount);
      if (amount <= 0)
        throw new Error(
          "El valor de la cuenta por pagar dee ser mayor que cero",
        );

      const { supplierRows } = await connection.execute(
        `
                SELECT id
                FROM suppliers
                WHERE id = ?
                AND company_id = ?
                LIMIT 1
                `,
        [supplier_id, company_id],
      );

      if (!supplierRows.length)
        throw new Error("El proveedor no existe para esta empresa");

      const [existingRows] = await connection.execute(
        `
                SELECT id
                FROM accounts_payable
                WHERE company_id = ?
                AND reference_type = ?
                AND reference_id = ?
                AND status != 'cancelled'
                LIMIT 1
                `,
        [company_id, reference_type, reference_id],
      );

      if (existingRows.length)
        throw new Error("Ya existe una cuenta por pagar para esta referencia");

      const [result] = await connection.execute(
        `
                INSERT INTO accounts_payable
                (
                    company_id,
                    supplier_id,
                    reference_type,
                    reference_id,
                    issue_date,
                    due_date,
                    original_amount,
                    pending_amount,
                    status,
                    notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                `,
        [
          company_id,
          supplier_id,
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
      return await AccountPayable.findById(result.insertId, company_id);
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
            ap.*,
            s.first_name AS supplier_name
        FROM accounts_payable ap
        INNER JOIN suppliers s
            ON s.id = ap.supplier_id
        WHERE ap.company_id = ?
        ORDER BY ap.id DESC
        `,
      [company_id],
    );
    return rows;
  }
}
