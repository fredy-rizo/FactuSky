import { db } from "../../../../database/MySQL/MySQL.js";

export class Payment {
  constructor({
    id = null,
    company_id,
    name,
    code,
    description,
    active = true,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.name = name),
      (this.code = code),
      (this.description = description),
      (this.active = active));
  }

  async save() {
    const [result] = await db.execute(
      `
            INSERT INTO payment_methods
            (
                company_id,
                name,
                code,
                description,
                active
            )
            VALUES(?,?,?,?,?)
            `,
      [
        this.company_id,
        this.name,
        this.code,
        this.description || null,
        this.active,
      ],
    );
    this.id = result.insertId;
    return this;
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT * 
            FROM payment_methods
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );
    return rows[0];
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM payment_methods
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
        FROM payment_methods
        WHERE company_id = ?
        `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const { name, code, description, active } = data;

    const [result] = await db.execute(
      `
            UPDATE payment_methods
            SET
                name = ?,
                code = ?,
                description = ?,
                active = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [name, code, description || null, active, id, company_id],
    );
    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
            DELETE FROM payment_methods
            WHERE id = ?
            AND company_id = ?
            `,
      [id, company_id],
    );
    return result;
  }
}
