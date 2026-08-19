import { db } from "../../../../../database/MySQL/MySQL.js";

export class CashRegister {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const { company_id, name, description, status = "active" } = this;

    const [result] = await db.execute(
      `
            INSERT INTO cash_registers
            (
                company_id,
                name,
                description,
                status
            )
            VALUES(?,?,?,?)
            `,
      [company_id, name, description || null, status],
    );

    return await CashRegister.findById(result.insertId, company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM cash_registers
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM cash_registers
            WHERE company_id = ?
            ORDER BY id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS total
            FROM cash_registers
            WHERE company_id = ?
            `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const { name, description, status } = data;

    const [result] = await db.execute(
      `
            UPDATE cash_registers
            SET
                name = ?,
                description = ?,
                status = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [name, description || null, status, id, company_id],
    );
    return result;
  }
}
