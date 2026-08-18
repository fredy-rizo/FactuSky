import { db } from "../../../../database/MySQL/MySQL.js";

export class InventoryMovement {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        product_id,
        warehouse_id,
        type,
        quantity,
        referente_type,
        referente_id,
        reason,
        user_id,
      } = this;

      const [inventoryRows] = await connection.execute(
        `
        SELECT *
        FROM inventory
        WHERE company_id = ?
        AND product_id = ?
        AND warehouse_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [company_id, product_id, warehouse_id],
      );

      if (!inventoryRows.length) throw new Error("INVENTORY_NOT_FOUND");

      const inventory = inventoryRows[0];

      const previous_quantity = Number(inventory.quantity);

      let new_quantity = previous_quantity;

      if (type === "entry" || type === "transfer_in" || type === "return") {
        new_quantity += Number(quantity);
      }

      if (type === "exit" || type === "transfer_out") {
        new_quantity -= Number(quantity);
      }

      if (type === "adjustment") {
        new_quantity = Number(quantity);
      }

      if (new_quantity < 0) throw new Error("INSUFFICIENT_STOCK");

      const [movementResult] = await connection.execute(
        `
                INSERT INTO inventory_movements
                (
                    company_id,
                    product_id,
                    warehouse_id,
                    type,
                    quantity,
                    previous_quantity,
                    new_quantity,
                    reference_type,
                    reference_id,
                    reason,
                    user_id
                )
                VALUES(?,?,?,?,?,?,?,?,?,?,?)
                `,
        [
          company_id,
          product_id,
          warehouse_id,
          type,
          quantity,
          previous_quantity,
          new_quantity,
          referente_type || null,
          referente_id || null,
          reason || null,
          user_id || null,
        ],
      );

      await connection.execute(
        `
                UPDATE inventory
                SET quantity = ?
                WHERE id = ?
                `,
        [new_quantity, inventory.id],
      );

      await connection.commit();
      this.id = movementResult.insertId;
      return this;
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
        m.*,
        p.name AS product_name,
        p.sku,
        w.name AS warehouse_name,
        w.code AS warehouse_code

      FROM inventory_movements m

      INNER JOIN products p
        ON p.id = m.product_id

      INNER JOIN warehouses w
        ON w.id = m.warehouse_id

      WHERE m.id = ?
      AND m.company_id = ?

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
        m.*,
        p.name AS product_name,
        p.sku,
        w.name AS warehouse_name,
        w.code AS warehouse_code

      FROM inventory_movements m

      INNER JOIN products p
        ON p.id = m.product_id

      INNER JOIN warehouses w
        ON w.id = m.warehouse_id

      WHERE m.company_id = ?

      ORDER BY m.id DESC
            `,
      [company_id],
    );
    return rows.map((row) => new InventoryMovement(row));
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS count
            FROM inventory_movements
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }
}
