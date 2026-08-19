import { db } from "../../../../database/MySQL/MySQL.js";

export class Purchase {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        supplier_id,
        warehouse_id,
        invoice_number,
        purchase_date,
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

      const [purchaseResult] = await connection.execute(
        `
        INSERT INTO purchases
        (
          company_id,
          supplier_id,
          warehouse_id,
          invoice_number,
          purchase_date,
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes,
          user_id
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          supplier_id,
          warehouse_id,
          invoice_number || null,
          purchase_date || new Date(),
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

      const purchase_id = purchaseResult.insertId;

      for (const item of items) {
        await connection.execute(
          `
          INSERT INTO purchase_items
          (
            purchase_id,
            product_id,
            quantity,
            unit_cost,
            discount,
            tax,
            subtotal,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            purchase_id,
            item.product_id,
            item.quantity,
            item.unit_cost,
            item.discount || 0,
            item.tax || 0,
            item.subtotal,
            item.total,
          ],
        );
      }

      await connection.commit();
      return await Purchase.findById(purchase_id, company_id);
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

      const [purchaseRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM purchases
        WHERE id = ?
          AND company_id = ?
          AND status = 'draft'
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!purchaseRows) {
        await connection.rollback();
        return null;
      }

      const purchase = purchaseRows[0];

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
          [Number(item.quantity), purchase.warehouse_id, Number(item.quantity)],
        );

        if (result.affectedRows === 0) {
          throw new Error(
            `Inventario insuficiente para el producto ${item.product_id}`,
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE purchases
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
    const [purchaseRows] = await db.execute(
      `
            SELECT *
            FROM purchases
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!purchaseRows.length) return null;

    const [items] = await db.execute(
      `
      SELECT
          pi.*,
          p.name AS product_name
      FROM purchase_items pi
      INNER JOIN products p
          ON p.id = pi.product_id
      WHERE pi.purchase_id = ?
      ORDER BY pi.id ASC
            `,
      [id],
    );
    return {
      ...purchaseRows[0],
      items,
    };
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM purchases
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
            FROM purchases
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { invoice_number, purchase_date, notes, payment_status } = data;

    const [result] = await db.execute(
      `
            UPDATE purchases
            SET
                invoice_number = ?,
                purchase_date = ?,
                notes= ?,
                payment_status = ?
            WHERE id = ?
            AND company_id = ?
            AND status = 'draft'
            `,
      [
        invoice_number || null,
        purchase_date,
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

      const [purchaseRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM purchases
        WHERE id = ?
          AND company_id = ?
          AND status IN ('draft', 'confirmed')
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!purchaseRows.length) {
        await connection.rollback();
        return null;
      }

      const purchase = purchaseRows[0];

      if (purchase.status === "confirmed") {
        const [items] = await connection.execute(
          `
          SELECT product_id, quantity
          FROM purchase_items
          WHERE purchase_id = ?
          `,
          [id],
        );

        for (const item of items) {
          await connection.execute(
            `
            UPDATE inventory
            SET quantity = quantity - ?
            WHERE product_id = ?
              AND warehouse_id = ?
            `,
            [Number(item.quantity), item.product_id, purchase.warehouse_id],
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE purchases
        SET status = 'cancelled'
        WHERE id = ?
          AND company_id = ?
          AND status IN ('draft', 'confirmed')
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
