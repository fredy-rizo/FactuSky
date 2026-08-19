import { db } from "../../../../database/MySQL/MySQL.js";

export class Sale {
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
        payment_method_id,
        invoice_number,
        sale_date,
        subtotal,
        tax,
        discount,
        total,
        status = "draft",
        payment_status = "pending",
        notes,
        user_id,
        items,
      } = this;

      const [saleResult] = await connection.execute(
        `
        INSERT INTO sales
        (
          company_id,
          customer_id,
          warehouse_id,
          payment_method_id,
          invoice_number,
          sale_date,
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes,
          user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          customer_id || null,
          warehouse_id,
          payment_method_id || null,
          invoice_number || null,
          sale_date || new Date(),
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes || null,
          user_id || null,
        ],
      );

      const sale_id = saleResult.insertId;

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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            sale_id,
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

      return await Sale.findById(sale_id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async confirm(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM sales
        WHERE id = ?
          AND company_id = ?
          AND status = 'draft'
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!saleRows) {
        await connection.rollback();
        return null;
      }

      const sale = saleRows[0];

      const [items] = await connection.execute(
        `
        SELECT product_id, quantity
        FROM sale_items
        WHERE sale_id = ?
        `,
        [id],
      );

      for (const item of items) {
        const [result] = await connection.execute(
          `
          UPDATE inventory
          SET quantity = quantity - ?
          WHERE product_id = ?
            AND warehouse_id = ?
            AND quantity >= ?
          `,
          [
            Number(item.quantity),
            item.product_id,
            sale.warehouse_id,
            Number(item.quantity),
          ],
        );

        if (result.affectedRows === 0) {
          throw new Error(
            `Inventario insuficiente para el producto ${item.product_id}`,
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE sales
        SET status = "confirmed"
        WHERE id = ?
          AND company_id = ?
          AND status = "draft"
        `,
        [id, company_id],
      );
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findById(id, company_id) {
    const [saleRows] = await db.execute(
      `
      SELECT *
      FROM sales
      WHERE id = ?
      AND company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );

    if (!saleRows.length) return null;

    const [items] = await db.execute(
      `
      SELECT
        si.*,
        p.name AS product_name
      FROM sale_items si
      INNER JOIN products p
        ON p.id = si.product_id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
      `,
      [id],
    );

    return {
      ...saleRows[0],
      items,
    };
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM sales
      WHERE company_id = ?
      ORDER BY id DESC
      `,
      [company_id],
    );

    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS count
      FROM sales
      WHERE company_id = ?
      `,
      [company_id],
    );

    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const {
      customer_id,
      warehouse_id,
      payment_method_id,
      invoice_number,
      sale_date,
      notes,
      payment_status,
    } = data;

    const [result] = await db.execute(
      `
      UPDATE sales
      SET
        customer_id = ?,
        warehouse_id = ?,
        payment_method_id = ?,
        invoice_number = ?,
        sale_date = ?,
        notes = ?,
        payment_status = ?
      WHERE id = ?
      AND company_id = ?
      AND status = 'draft'
      `,
      [
        customer_id || null,
        warehouse_id,
        payment_method_id || null,
        invoice_number || null,
        sale_date,
        notes || null,
        payment_status || "pending",
        id,
        company_id,
      ],
    );

    return result;
  }

  static async cancel(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM sales
        WHERE id = ?
          AND company_id = ?
          AND status IN('draft','confirmed')
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!saleRows.length) {
        await connection.rollback();
        return null;
      }

      const sale = saleRows[0];

      if (sale.status === "confirmed") {
        const [items] = await connection.execute(
          `
          SELECT product_id, quantity
          FROM sales_items
          WHERE sale_id = ?
          `,
          [id],
        );

        for (const item of items) {
          await connection.execute(
            `
            UPDATE inventory
            SET quantity = quantity + ?
            WHERE product_id = ?
              AND warehouse_id = ?
              AND status IN('draft','confirmed')
            `,
            [Number(item.quantity), item.product_id, sale.warehouse_id],
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE sales
        SET status = 'cancelled'
        WHERE id = ?
          AND company_id = ?
          AND status IN('draft','confirmed')
        `,
        [id, company_id],
      );

      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
