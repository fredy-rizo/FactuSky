import { db } from "../../../../database/MySQL/MySQL.js";

export class Product {
  constructor({
    id = null,
    company_id,
    category_id,
    unit_id,
    sku,
    barcode,
    name,
    description,
    cost = 0,
    price = 0,
    tax_rate = 0,
    minimum_stock = 0,
    active = true,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.category_id = category_id));
    this.unit_id = unit_id;
    ((this.sku = sku),
      (this.barcode = barcode),
      (this.name = name),
      (this.description = description),
      (this.cost = cost),
      (this.price = price),
      (this.tax_rate = tax_rate),
      (this.minimum_stock = minimum_stock),
      (this.active = active));
  }

  async save() {
    const [result] = await db.execute(
      `
      INSERT INTO products
      (
        company_id,
        category_id,
        unit_id,
        sku,
        barcode,
        name,
        description,
        cost,
        price,
        tax_rate,
        minimum_stock,
        active
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        this.company_id,
        this.category_id || null,
        this.unit_id || null,
        this.sku || null,
        this.barcode || null,
        this.name,
        this.description || null,
        this.cost,
        this.price,
        this.tax_rate,
        this.minimum_stock,
        this.active,
      ],
    );
    this.id = result.insertId;
    return this;
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                p.*,
                c.name AS category_name,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation
            FROM products p

            LEFT JOIN categories c
                ON c.id = p.category_id

            LEFT JOIN units u
                ON u.id = p.unit_id

            WHERE p.id = ?
                AND p.company_id = ?
            
            LIMIT 1
            `,
      [id, company_id],
    );
    return rows[0];
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                p.*,
                c.name AS category_name,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation

            FROM products p

            LEFT JOIN categories c
                ON c.id = p.category_id

            LEFT JOIN units u
                ON u.id = p.unit_id

            WHERE p.company_id = ?

            ORDER BY p.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE company_id = ?
        `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const {
      category_id,
      unit_id,
      sku,
      barcode,
      name,
      description,
      cost,
      price,
      tax_rate,
      minimum_stock,
      active,
    } = data;

    const [result] = await db.execute(
      `
      UPDATE products
        SET
          category_id = ?,
          unit_id = ?,
          sku = ?,
          barcode = ?,
          name = ?,
          description = ?,
          cost = ?,
          price = ?,
          tax_rate = ?,
          minimum_stock = ?,
          active = ?
      WHERE id = ?
      AND company_id = ?
      `,
      [
        category_id || null,
        unit_id || null,
        sku || null,
        barcode || null,
        name,
        description || null,
        cost,
        price,
        tax_rate,
        minimum_stock || null,
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
      DELETE FROM products
      WHERE id = ?
      AND company_id = ?
      `,
      [id, company_id],
    );

    return result;
  }
}
