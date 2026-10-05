import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantIntegration {
  static async createSaleFromOrder({
    company_id,
    order_id,
    user_id,
    payment_method_id,
    cash_opening_id,
  }) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Obtener orden
      const [orderRows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_orders
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        `,
        [order_id, company_id],
      );

      if (!orderRows.length) {
        throw new Error("Orden de restaurante no encontrada");
      }

      const order = orderRows[0];

      // 2. Validar estado
      if (!["served", "ready"].includes(order.status)) {
        throw new Error(
          "La orden debe estar lista o servida para generar la venta",
        );
      }

      // 3. Evitar doble facturación
      if (order.sale_id) {
        throw new Error("Esta orden ya tiene una venta asociada");
      }

      // 4. Obtener items
      const [items] = await connection.execute(
        `
        SELECT
            roi.*,
            p.name AS product_name
        FROM restaurant_order_items roi
        INNER JOIN products p
            ON p.id = roi.product_id
        WHERE roi.order_id = ?
        ORDER BY roi.id ASC
        `,
        [order_id],
      );

      if (!items.length) {
        throw new Error("La orden no contiene productos");
      }

      // 5. Crear venta
      const [saleResult] = await connection.execute(
        `
        INSERT INTO sales
        (
            company_id,
            customer_id,
            warehouse_id,
            reference_type,
            reference_id,
            sale_date,
            subtotal,
            payment_method_id,
            tax,
            discount,
            total,
            status,
            payment_status,
            user_id
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `,
        [
          company_id,
          order.customer_id || null,
          order.warehouse_id || null,
          "restaurant_order",
          order_id,
          new Date(),
          Number(order.subtotal) || 0,
          payment_method_id || null,
          Number(order.tax) || 0,
          Number(order.discount) || 0,
          Number(order.total) || 0,
          "confirmed",
          "paid",
          user_id || null,
        ],
      );

      const sale_id = saleResult.insertId;

      // 6. Crear sale_items
      for (const item of items) {
        await connection.execute(
          `
          INSERT INTO sale_items
          (
              sale_id,
              product_id,
              quantity,
              unit_price,
              discount,
              tax,
              subtotal,
              total
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            sale_id,
            item.product_id,
            Number(item.quantity) || 0,
            Number(item.unit_price) || 0,
            Number(item.discount) || 0,
            Number(item.tax) || 0,
            Number(item.subtotal) || 0,
            Number(item.total) || 0,
          ],
        );
      }

      // 7. Registrar movimiento de inventario (sin warehouse)
      for (const item of items) {
        const qty = Number(item.quantity) || 0;

        await connection.execute(
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
              user_id
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            company_id,
            item.product_id,
            null, // ✅ warehouse_id es null porque el flujo de restaurante no lo usa
            "exit",
            qty,
            0,
            0,
            "restaurant_order",
            order_id,
            user_id || null,
          ],
        );
      }

      // 8. Registrar movimiento de caja
      if (!cash_opening_id) {
        throw new Error("cash_opening_id es requerido para registrar el pago");
      }

      await connection.execute(
        `
        INSERT INTO cash_movements
        (
            company_id,
            cash_opening_id,
            user_id,
            movement_type,
            category,
            amount,
            description,
            reference_type,
            reference_id,
            movement_date
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          cash_opening_id,
          user_id || null,
          "income",
          "sale",
          Number(order.total) || 0,
          `Venta de restaurant #${order_id}`,
          "restaurant_order",
          order_id,
          new Date(),
        ],
      );

      // 9. Actualizar orden
      await connection.execute(
        `
        UPDATE restaurant_orders
        SET
            sale_id = ?,
            status = 'paid'
        WHERE id = ?
        AND company_id = ?
        `,
        [sale_id, order_id, company_id],
      );

      await connection.commit();
      return {
        sale_id,
        order_id,
        total: Number(order.total) || 0,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
