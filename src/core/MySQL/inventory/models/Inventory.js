import { db } from "../../../../database/MySQL/MySQL.js";

export class Inventory {
  constructor({
    id = null,
    company_id,
    product_id,
    warehouse_id,
    quantity = 0,
    reserved_quantity = 0,
    minimum_stock = 0,
    maximum_stock = null,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.product_id = product_id),
      (this.warehouse_id = warehouse_id),
      (this.quantity = quantity),
      (this.reserved_quantity = reserved_quantity),
      (this.minimum_stock = minimum_stock),
      (this.maximum_stock = maximum_stock));
  }

  async save() {
    const [result] = await db.execute(
      `
        INSERT INTO inventory
        (
            company_id,
            product_id,
            warehouse_id,
            quantity,
            reserved_quantity,
            minimum_stock,
            maximum_stock
        )
        VALUES(?,?,?,?,?,?,?)
        `,
      [
        this.company_id,
        this.product_id,
        this.warehouse_id,
        this.quantity,
        this.reserved_quantity,
        this.minimum_stock,
        this.maximum_stock,
      ],
    );

    this.id = result.insertId;
    return this;
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            i.*,
            p.name AS product_name,
            p.sku,
            w.name AS warehouse_name,
            w.code AS warehouse_code
        FROM inventory i

        INNER JOIN products p
            ON p.id = i.product_id
            
        INNER JOIN warehouses w
            ON w.id = i.warehouse_id

        WHERE i.id = ?
        AND i.company_id = ?

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
                i.*,
                p.name AS product_name,
                p.sku,
                w.name AS warehouse_name,
                w.code AS warehouse_code

            FROM inventory i

            INNER JOIN products p
                ON p.id = i.product_id

            INNER JOIN warehouses w
                ON w.id = i.warehouse_id

            WHERE i.company_id = ?

            ORDER BY i.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async findByProductWarehouse(company_id, product_id, warehouse_id) {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM inventory
        WHERE company_id = ?
        AND product_id = ?
        AND warehouse_id = ?
        LIMIT 1
        `,
      [company_id, product_id, warehouse_id],
    );
    return rows[0];
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS total
            FROM inventory
            WHERE company_id = ?
            `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const { quantity, reserved_quantity, minimum_stock, maximum_stock } = data;

    const [result] = await db.execute(
      `
            UPDATE inventory
            SET
                quantity = ?,
                reserved_quantity = ?,
                minimum_stock = ?,
                maximum_stock = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [
        quantity,
        reserved_quantity,
        minimum_stock,
        maximum_stock,
        id,
        company_id,
      ],
    );
    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
            DELETE FROM inventory
            WHERE id = ?
            AND company_id = ?
            `,
      [id, company_id],
    );
    return result;
  }
}
