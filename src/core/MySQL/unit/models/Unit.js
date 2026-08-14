import { db } from "../../../../database/MySQL/MySQL.js";

export class Unit {
  constructor({
    id = null,
    company_id,
    name,
    abbreviation,
    description,
    active = true,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.name = name),
      (this.abbreviation = abbreviation),
      (this.description = description),
      (this.active = active));
  }

  async save() {
    const [result] = await db.execute(
      `
      INSERT INTO units
      (
        company_id, 
        name, 
        abbreviation, 
        description, 
        active
      ) 
      VALUES(?,?,?,?,?)
      `,
      [
        this.company_id,
        this.name,
        this.abbreviation,
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
            FROM units
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
            FROM units
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
      FROM units
      WHERE company_id = ?
      `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const { name, abbreviation, description, active } = data;

    const [result] = await db.execute(
      `
      UPDATE units
      SET
        name = ?,
        abbreviation = ?,
        description = ?,
        active = ?
      WHERE id = ?
      AND company_id = ?
       `,
      [name, abbreviation, description || null, active, id, company_id],
    );
    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
            DELETE FROM units
            WHERE id = ?
            AND company_id = ?
            `,
      [id, company_id],
    );
    return result;
  }
}
