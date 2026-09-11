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

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        rki.*,
        p.name AS product_name,
        p.barcode AS product_code,
        ro.order_number,
        ro.table_id,
        ro.session_id,
        ro.status AS order_status,
        rt.table_number,
        rt.name AS table_name
      FROM restaurant_kitchen_items rki
      INNER JOIN product p
        ON p.id = rki.product_id
      INNER JOIN restaurant_orders ro
        ON ro.id = rki.order_id
        AND ro.company_id = rki.company_id
      WHERE rki.id = ?
      AND rki.company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id, status = null, limit = 100) {
    let query = `
      SELECT
        rki.*,
        p.name AS product_name,
        p.barcode AS product_code,
        ro.order_number,
        ro.table_id,
        ro.session_id,
        rt.table_number,
        rt.name AS table_name
      FROM restaurant_kitchen_items rki
      INNER JOIN products p
        ON p.id = rki.product_id
      INNER JOIN restaurant_orders ro
        ON ro.id = rki.order_id
        AND ro.company_id = rki.company_id
      INNER JOIN restaurant_tables rt
        ON rt.id = ro.table_id
        AND rt.company_id = ro.company_id
      WHERE rki.company_id = ?
    `;

    const params = [company_id];
    if (status) {
      query += ` AND rki.status = ? `;
      params;
    }

    query += `
      ORDER BY
        CASE rki.status
          WHEN 'pending' THEN 1
          WHEN 'preparing' THEN 2
          WHEN 'ready' THEN 3
          WHEN 'served' THEN 4
          WHEN 'cancelled' THEN 5
        END,
        rki.id ASC
      LIMIT ?
    `;

    params.push(Number(limit));
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findByOrder(order_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        rki.*,
        p.name AS product_name,
        p.barcode AS product_code
      FROM restaurant_kitchen_items rki
      INNER JOIN products p
        ON p.id = rki.product_id
      WHERE rki.order_id = ?
      AND rki.company_id = ?
      ORDER BY rki.id ASC
      `,
      [order_id, company_id],
    );
    return rows;
  }

  static async findByTable(table_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        rki.*,
        p.name AS product_name,
        ro.order_number,
        ro.status AS order_status,
        rt.table_number,
        rt.name AS table_number
      FROM restaurant_kitchen_items rki
      INNER JOIN products p
        ON p.id = rki.product_id
      INNER JOIN restaurant_orders ro
        ON ro.id = rki.order_id
        AND ro.company_id = rki.company_id
      INNER JOIN restaurant_tables rt
        ON rt.id = ro.table_id
        AND rt.company_id = ro.company_id
      WHERE ro.table_id = ?
      AND rki.company_id = ?
      ORDER BY rki.id DESC
      `,
      [table_id, company_id],
    );
    return rows;
  }

  static async changeStatus(id, company_id, newStatus) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_kitchen_items
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [id, company_id],
      );

      if (!rows.length) throw new Error("Item de cocina no encontrado");

      const item = rows[0];
      const transitions = {
        pending: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
        ready: ["served"],
        served: [],
        cancelled: ["pending"],
      };

      if (!transitions[item.status]?.includes(newStatus))
        throw new Error(
          `No se puede cambiar el estado de ${item.status} a ${newStatus}`,
        );

      let extraFields = "";
      if (newStatus === "preparing") {
        extraFields = ` started_at = NOW() `;
      }

      if (newStatus === "ready") {
        extraFields = ` ready_at = NOW()`;
      }

      if (newStatus === "served") {
        extraFields = ` served_at = NOW()`;
      }

      if (newStatus === "cancelled") {
        extraFields = ` cancelled_at = NOW()`;
      }

      await connection.execute(
        `
        UPDATE restaurant_kitchen_items
        SET
          status = ?
          ${extraFields}
        WHERE id = ?
        AND company_id = ?
        `,
        [newStatus, id, company_id],
      );

      await this.syncOrderStatus(connection, item.order_id, company_id);
      await connection.commit();
      return await RestaurantKitchenItem.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async syncOrderStatus(connection, order_id, company_id) {
    const [items] = await connection.execute(
      `
      SELECT
        status,
        COUNT(*) AS quantity
      FROM restaurant_kitchen_items
      WHERE order_id = ?
      AND company_id = ?
      GROUP BY status
      `,
      [order_id, company_id],
    );

    if (!items.length) return;

    const statusMap = {};
    for (const item of items) {
      statusMap[item.status] = Number(item.quantity);
    }

    let orderStatus = null;
    const total = Object.values(statusMap).reduce(
      (sum, value) => sum + value,
      0,
    );

    const served = statusMap.served || 0;
    const ready = statusMap.ready || 0;
    const preparing = statusMap.preparing || 0;
    const pending = statusMap.pending || 0;
    const cancelled = statusMap.cancelled || 0;

    if (total > 0 && served + cancelled === total) {
      if (served > 0) {
        orderStatus = "served";
      }
    } else if (
      ready > 0 ||
      (ready + served > 0 && ready + served + cancelled === total)
    ) {
      orderStatus = "ready";
    } else if (preparing > 0) {
      orderStatus = "preparing";
    } else if (pending > 0) {
      orderStatus = "confirmed";
    }

    if (orderStatus) {
      await connection.execute(
        `
        UPDATE restaurant_order
        SET status = ?
        WHERE id = ?
        AND company_id = ?
        AND status NOT IN ('paid','cancelled')
        `,
        [orderStatus, order_id, company_id],
      );
    }
  }

  static async updateNotes(id, company_id, notes) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_kitchen_items
      SET notes = ?
      WHERE id = ?
      AND company_id = ?
      ANd status IN ('pending','preparing')
      `,
      [notes || null, id, company_id],
    );
    return result;
  }

  static async countByStatus(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        status,
        COUNT(*) AS total
        FROm restaurant_kitchen_items
        WHERE company_id = ?
        GROUP BY status
      `,
      [company_id],
    );
    return rows;
  }
}
