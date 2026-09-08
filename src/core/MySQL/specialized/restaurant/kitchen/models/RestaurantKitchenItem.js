import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantKitchenItem {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static async createFromOrder(order_id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        `
                SELECT *
                FROM restaurant_orders
                WHERE id = ?
                AND company_id = ?
                LIMIT 1
                FOR UPDATE
                `,
        [order_id, company_id],
      );

      if (!orderRows.length) throw new Error("Orden no encontrada");

      const orden = orderRows[0];
      if (orden.status !== "confirmed")
        throw new Error(
          "La orden debe estar confirmada para enviarla a cocina",
        );

      const [items] = await connection.execute(
        `
                SELECT *
                FROM restaurant_order_items
                WHERE order_id = ?
                AND status != 'cancelled'
                ORDER BY id ASC
                `,
        [order_id],
      );

      if (!items.length)
        throw new Error("La orden no tiene productos para enviar a cocina");

      const createdItems = [];
      for (const item of items) {
        const [existing] = await connection.execute(
          `
                    SELECT id
                    FROM restaurant_kitchen_items
                    WHERE order_item_id = ?
                    LIMIT 1
                    `,
          [item.id],
        );

        if (existing.length) continue;

        const [result] = await connection.execute(
          `
                    INSERT INTO restaurant_kitchen_items
                    (
                        company_id,
                        order_id,
                        orden_item_id,
                        product_id,
                        quantity,
                        status,
                        notes
                    )
                    VALUES(?,?,?,?,?, 'pending', ?)
                    `,
          [
            company_id,
            order_id,
            item.id,
            item.product_id,
            item.quantity,
            item.notes || null,
          ],
        );
        createdItems.push(result.insertId);
      }

      await connection.commit();
      return createdItems;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findById(id, company_id) {}
}
