import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantOrder {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        session_id,
        table_id,
        customer_id,
        waiter_id,
        order_number,
        notes,
      } = this;

      const [sessionRows] = await connection.execute(
        `
                SELECT *
                FROM restaurant_table_sessions
                WHERE id = ?
                AND company_id = ?
                AND table_id = ?
                AND status = 'open'
                FOR UPDATE
                `,
        session_id,
        company_id,
        table_id,
      );

      if (!sessionRows.length)
        throw new Error(
          "La sesion no existe, no pertenece a la mesa o no esta abierta",
        );

      const [tableRows] = await connection.execute(
        `
                SELECT *
                FROM restaurant_tables
                WHERE id = ?
                AND company_id = ?
                AND status = 'occupied'
                FOR UPDATE
                `,
        [table_id, company_id],
      );

      if (!tableRows.length)
        throw new Error("La mesa no existe o no esta ocupada");

      const [orderResult] = await connection.execute(
        `
                INSERT INTO restaurant_orders
                (
                    company_id,
                    session_id,
                    table_id,
                    customer_id,
                    waiter_id,
                    order_number,
                    status,
                    subtotal,
                    tax,
                    discount,
                    total,
                    notes
                )
                VALUES(?,?,?,?,?,?,'pending',0,0,0,0,?)
                `,
        [
          company_id,
          session_id,
          table_id,
          customer_id || null,
          waiter_id || null,
          order_number,
          notes || null,
        ],
      );

      const order_id = orderResult.insertId();
      return await RestaurantOrder.findById(order_id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findById(id, company_id) {
    const [orderRows] = await db.execute(
      `
            SELECT
                ro.*,
                rt.table_number,
                rt.name AS table_number,
                c.first_name AS customer_name
            FROM restaurant_orders ro
            INNER JOIN restaurant_tables rt
                ON rt.id = ro.table_id
                AND rt.company_id = ro.company_id
            LEFT JOIN customers c
                ON c.id = ro.customer_id
                AND c.company_id = ro.company_id
            WHERE ro.id = ?
            AND ro.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!orderRows.length) return null;

    const [items] = await db.execute(
      `
            SELECT
                roi.*,
                p.name AS product_name,
                p.code AS product_code
            FROM restaurant_order_items roi
            INNER JOIN products p
                ON p.id = roi.product_id
            WHERE roi.order_id = ?
            ORDER BY roi.id ASC
            `,
      [id],
    );
    return {
      ...orderRows[0],
      items,
    };
  }

  static async findAll(company_id, skip = 0, limit = 20, status = null) {
    let query = `
        SELECT
            ro.*,
            rt.table_number,
            rt.name AS table_name,
            c.first_name AS customer_name
        FROM restaurant_orders ro
        INNER JOIN restaurant_tables rt
            ON rt.id = ro.table_id
            AND rt.company_id = ro.company_id
        LEFT JOIN customers c
            ON c.id = ro.customer_id
            AND c.company_id = ro.company_id
        WHERE ro.company_id = ?
    `;

    const params = [company_id];
    if (status) {
      query += ` AND ro.status = ? `;
      params.push(status);
    }

    query += `
        ORDER BY ro.id DESC
        LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(skip));
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async count(company_id, status = null) {
    let query = `
        SELECT COUNT(*) AS count
        FROM restaurant_orders
        WHERE company_id = ?
    `;

    const params = [company_id];
    if (status) {
      query += ` AND status = ? `;
      params.push(status);
    }

    const [rows] = await db.execute(query, params);
    return Number(rows[0].count);
  }

  static async findByTable(table_id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            ro.*,
            rt.table_number,
            rt.name AS table_name
        FROM restaurant_orders ro
        INNER JOIN restaurant_orders ro
            ON rt.id = ro.table_id
            AND rt.company_id = ro.company_id
        WHERE ro.table_id = ?
        AND ro.company_id = ?
        ORDER BY ro.id DESC
        `,
      [table_id, company_id],
    );
    return rows;
  }

  static async findBySession(session_id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            ro.*,
            rt.table_number,
            rt.name AS table_name
        FROM restaurant_orders ro
        INNER JOIN restaurant_tables rt
            ON rt.id = ro.table_id
            AND rt.company_id = ro.company_id
        WHERE ro.session_id = ?
        AND ro.company_id = ?
        ORDER BY ro.id ASC
        `,
      [session_id, company_id],
    );
    return rows;
  }

  static async addItem(order_id, company_id, data) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        `
            SELECT *
            FROM restaurant_orders
            WHERE id = ?
            AND company_id = ?
            FOR UPDATE
            `,
        [order_id, company_id],
      );

      if (!orderRows.length) throw new Error("Orden no encontrada");

      const order = orderRows[0];
      if (!["pending", "confirmed"].includes(order.status))
        throw new Error("No se pueden modificar productos en esta orden");

      const {
        product_id,
        quantity,
        unit_price,
        discount = 0,
        tax = 0,
        notes,
      } = data;

      if (!product_id || !quantity || Number(quantity) <= 0)
        throw new Error("Producto y cantidad valida son requeridos");

      const [productRows] = await connection.execute(
        `
            SELECT id, name
            FROM products
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
        [product_id, company_id],
      );

      if (!productRows.length) throw new Error("Producto no encontrado");

      let price = Number(unit_price);
      if (!Number.isFinite(price) || price < 0)
        throw new Error("El precio del producto no es valido");

      const qty = Number(quantity);
      const discountValue = Number(discount) || 0;
      const taxValue = Number(tax) || 0;

      const subtotal = qty * price;
      const total = subtotal + taxValue - discountValue;

      const [itemResult] = await connection.execute(
        `
            INSERT INTO restaurant_order_items
            (
                order_id,
                product_id,
                quantity,
                unit_price,
                discount,
                tax,
                subtotal,
                total,
                status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `,
        [
          order_id,
          product_id,
          qty,
          price,
          discountValue,
          taxValue,
          subtotal,
          total,
          notes || null,
        ],
      );

      await RestaurantOrder.recalculateTransaction(connection, order_id);

      await connection.commit();
      return itemResult.insertId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async updateItem(order_id, item_id, company_id, data) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        `
            SELECT *
            FROM restaurant_orders
            WHERE id = ?
            AND company_id = ?
            FOR UPDATE
            `,
        [order_id, company_id],
      );

      if (!orderRows.length) throw new Error("Order no encontrada");

      if (!["pending", "confirmed"].includes(orderRows[0].status))
        throw new Error("No se puede modificar esta orden");

      const [itemRows] = await connection.execute(
        `
            SELECT *
            FROM restaurant_order_items
            WHERE id = ?
            AND order_id = ?
            LIMIT 1
            `,
        [item_id, order_id],
      );

      if (!itemRows.length)
        throw new Error("Producto de la orden no encontradoo");

      const item = itemRows[0];
      const quantity =
        data.quantity !== undefined
          ? Number(data.quantity)
          : Number(item.quantity);
      const unit_price =
        data.unit_price !== undefined
          ? Number(data.unit_price)
          : Number(item.unit_price);
      const discount =
        data.discount !== undefined
          ? Number(data.discount)
          : Number(item.discount);
      const tax = data.tax !== undefined ? Number(data.tax) : Number(item.tax);
      const notes =
        data.notes !== undefined ? Number(data.notes) : Number(item.notes);

      if (quantity <= 0) throw new Error("La cantidad debe ser mayor a 0");

      const subtotal = quantity * unit_price;
      const total = subtotal + tax - discount;

      await connection.execute(
        `
            UPDATE restaurant_order_items
            SET
                quantity = ?,
                unit_price = ?,
                discount = ?,
                tax = ?,
                subtotal = ?,
                total= ?,
                notes = ?
            WHERE id = ?
            AND order_id = ?
            `,
        [
          quantity,
          unit_price,
          discount,
          tax,
          subtotal,
          total,
          notes || null,
          item_id,
          order_id,
        ],
      );

      await RestaurantOrder.recalculateTransaction(connection, order_id);
      await connection.commit();
      return await RestaurantOrder.findById(order_id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
