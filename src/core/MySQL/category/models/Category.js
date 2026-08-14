import { db } from "../../../../database/MySQL/MySQL.js";

export class Category {
  constructor({
    id = null,
    company_id,
    name,
    description = null,
    active = true,
  }) {
    this.id = id;
    this.company_id = company_id;
    this.name = name;
    this.description = description;
    this.active = active;
  }

  async save() {
    const [result] = await db.execute(
      `
      INSERT INTO categories
      (
        company_id,
        name,
        description,
        active
      )
      VALUES (?, ?, ?, ?)
      `,
      [this.company_id, this.name, this.description || null, this.active],
    );

    this.id = result.insertId;

    return this;
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM categories
      WHERE id = ?
      AND company_id = ?
      LIMIT 1
    `,
      [id, company_id],
    );

    return rows[0] || null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM categories
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
      FROM categories
      WHERE company_id = ?
      `,
      [company_id],
    );
    return rows[0].total;
  }

  static async find(company_id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `
      SELECT *
      FROM categories
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [company_id, limit, offset],
    );
    return rows;
  }

  static async update(id, company_id, data) {
    const { name, description, active } = data;

    const [result] = await db.execute(
      `
      UPDATE categories
      SET
        name = ?,
        description = ?,
        active = ?
      WHERE id = ?
      AND company_id = ?
      `,
      [name, description || null, active, id, company_id],
    );

    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
      DELETE FROM categories
      WHERE id = ?
      AND company_id = ?
      `,
      [id, company_id],
    );

    return result;
  }
}
