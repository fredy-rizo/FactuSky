import { db } from "../../../../../database/MySQL/MySQL.js";

export class Order {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        customer_id,
        warehouse_id,
        order_number,
        order_date,
        delivery_date,
        subtotal,
        tax,
        discount,
        total,
        status = "draft",
        notes,
        user_id,
        quotation_id,
        items = [],
      } = this;

      const [result] = await connection.execute(
        `
                INSERT INTO orders
                (
                    company_id,
                    customer_id,
                    warehouse_id,
                    order_number,
                    order_date,
                    delivery_date,
                    subtotal,
                    tax,
                    discount,
                    total,
                    status,
                    notes,
                    user_id,
                    quotation_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
        [
          company_id,
          customer_id || null,
          warehouse_id || null,
          order_number,
          order_date || new Date(),
          delivery_date || null,
          subtotal,
          tax,
          discount,
          total,
          status,
          notes || null,
          user_id || null,
          quotation_id || null,
        ],
      );

      const order_id = result.insertId;
      for (const item of items) {
        await connection.execute(
          `
         INSERT INTO order_items
          (
            order_id,
            product_id,
            quantity,
            unit_price,
            discount,
            tax,
            subtotal,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            order_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.discount || 0,
            item.tax || 0,
            item.subtotal,
            item.total,
          ],
        );
      }

      await connection.commit();
      return await Order.findById(order_id, company_id);
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
            SELECT *
            FROM orders
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!rows.length) return null;

    const [items] = await db.execute(
      `
            SELECT
                oi.*,
                p.name AS product_name
            FROM order_items oi
            INNER JOIN products p
                ON p.id = oi.product_id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
            `,
      [id],
    );
    return {
      ...rows[0],
      items,
    };
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                o.*,
                c.first_name AS customer_name
            FROM orders o
            LEFT JOIN customers c
                ON c.id = o.customer_id
            WHERE o.company_id = ?
            ORDER BY o.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS count
            FROM orders
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }

  static async updateStatus(id, company_id, status) {
    return await db.execute(
      `
            UPDATE orders
            SET status = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [status, id, company_id],
    );
  }

  static async cancel(id, company_id) {
    return await this.updateStatus(id, company_id, "cancelled");
  }
}
