import { db } from "../../../../database/MySQL/MySQL.js";

export class Warehouses {
  constructor({
    id = null,
    company_id,
    name,
    code,
    description,
    address,
    city,
    active = true,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.name = name),
      (this.code = code),
      (this.description = description),
      (this.adddress = address),
      (this.city = city));
    this.active = active;
  }

  async save() {
    const [result] = await db.execute(
      `
            INSERT INTO warehouses
            (
                company_id,
                name,
                code,
                description,
                address,
                city,
                active
            )
            VALUES(?,?,?,?,?,?,?)
            `,
      [
        this.company_id,
        this.name,
        this.code,
        this.description || null,
        this.adddress || null,
        this.city || null,
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
            FROM warehouses
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
            FROM warehouses
            WHERE company_id = ?
            ORDER BY id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async findByCode(company_id, code) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM warehouses
            WHERE company_id = ?
            AND code = ?
            LIMIT 1
            `,
      [company_id, code],
    );
    return rows[0];
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS total
            FROM warehouses
            WHERE company_id = ?
            `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const { name, code, description, adddress, city, active } = data;

    const [result] = await db.execute(
      `
            UPDATE warehouses
            SET
                name = ?,
                code = ?,
                description = ?,
                address = ?,
                city = ?,
                active= ?
            WHERE id = ?
            AND company_id = ?
            `,
      [
        name,
        code,
        description || null,
        adddress || null,
        city || null,
        active,
        id,
        company_id,
      ],
    );
    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
            DELETE FROM warehouses
            WHERE id = ?
            AND company_id = ?
            `,
      [id, company_id],
    );
    return result;
  }
}
