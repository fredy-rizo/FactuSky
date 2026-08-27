import { db } from "../../../../../database/MySQL/MySQL.js";

export class Quotation {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      const {
        company_id,
        customer_id,
        warehouse_id,
        quotation_number,
        quotation_date,
        expiration_date,
        subtotal,
        tax,
        discount,
        total,
        status = "draft",
        notes,
        user_id,
        items = [],
      } = this;

      const [result] = await connection.execute(
        `
                INSERT INTO quotations
                (
                    company_id,
                    customer_id,
                    warehouse_id,
                    quotation_number,
                    quotation_date,
                    expiration_date,
                    subtotal,
                    tax,
                    discount,
                    total,
                    status,
                    notes,
                    user_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
        [
          company_id,
          customer_id || null,
          warehouse_id || null,
          quotation_number,
          quotation_date || new Date(),
          expiration_date || null,
          subtotal,
          tax,
          discount,
          total,
          status,
          notes || null,
          user_id || null,
        ],
      );

      const quotation_id = result.insertId;
      for (const item of items) {
        await connection.execute(
          `
                    INSERT INTO quotation_items
                    (
                        quotation_id,
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
            quotation_id,
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
      return await Quotation.findById(quotation_id, company_id);
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
            FROM quotations
            WHERE = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );
    if (!rows.length) return null;

    const [items] = await db.execute(
      `
            SELECT
                qi.*,
                p.name AS product_name
            FROM quotation_items pi
                ON p.id = qi.product_id
            WHERE qi.quotation_id = ?
            ORDER BY qi.id ASC
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
                q.*,
                c.first_name AS customer_name
            FROM quotations q
            LEFT JOIN customers c
                ON c.id = q.customer_id
            WHERE q.company_id = ?
            ORDER BY q.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS count
            FROM quotations
            WHERE company_id = ?
            `,
      [company_id],
    );
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { customer_id, warehouse_id, expiration_date, notes } = data;

    return await db.execute(
      `
            UPDATE quotations
            SET
                customer_id = ?,
                warehose_id = ?,
                expiration_date = ?,
                notes = ?
            WHERE id = ?
            AND company_id = ?
            AND status = 'draft'
            `,
      [
        company_id || null,
        warehouse_id || null,
        expiration_date || null,
        notes || null,
        id,
        company_id,
      ],
    );
  }

  static async updateStatus(id, company_id, status) {
    return await db.execute(
      `
            UPDATE quotations
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
