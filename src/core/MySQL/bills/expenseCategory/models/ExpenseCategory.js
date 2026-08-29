import { db } from "../../../../../database/MySQL/MySQL.js";

export class ExpenseCategory {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const [result] = await db.execute(
      `
      INSERT INTO expense_categories
      (
        company_id,
        name,
        description,
        status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        this.company_id,
        this.name,
        this.description || null,
        this.status || "active",
      ],
    );

    return await ExpenseCategory.findById(result.insertId, this.company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM expense_categories
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
            FROM expense_categories
            WHERE company_id = ?
            ORDER BY name ASC
            `,
      [company_id],
    );
    return rows;
  }

  static async findActive(company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM expense_categories
            WHERE company_id = ?
            AND status = 'active'
            ORDER BY name ASC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS count
            FROM expense_categories
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { name, description, status } = data;

    return await db.execute(
      `
            UPDATE expense_categories
            SET
                name = ?,
                description = ?,
                status = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [name, description || null, status || "active", id, company_id],
    );
  }

  static async updateStatus(id, company_id, status) {
    return await db.execute(
      `
            UPDATE expense_categories
            SET status = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [status, id, company_id],
    );
  }
}
