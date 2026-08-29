import { db } from "../../../../../database/MySQL/MySQL.js";

export class Promotion {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        name,
        description,
        type,
        value,
        minimum_amount = 0,
        start_date,
        end_date,
        usage_limit,
        status = "active",
        products = [],
      } = this;

      const [result] = await connection.execute(
        `
        INSERT INTO promotions
        (
          company_id,
          name,
          description,
          type,
          value,
          minimum_amount,
          start_date,
          end_date,
          usage_limit,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          name,
          description || null,
          type,
          value,
          minimum_amount,
          start_date,
          end_date || null,
          usage_limit || null,
          status,
        ],
      );

      const promotion_id = result.insertId;
      for (const product_id of products) {
        await connection.execute(
          `
                    INSERT INTO promotion_products
                    (
                        promotion_id,
                        product_id
                    )
                    VALUES(?,?)
                    `,
          [promotion_id, product_id],
        );
      }

      await connection.commit();
      return await Promotion.findById(promotion_id, company_id);
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
            FROM promotions
            WHERE id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );
    if (!rows.length) return null;

    const [products] = await db.execute(
      `
            SELECT
                pp.product_id,
                p.name AS product_name
            FROM promotion_products pp
            INNER JOIN products p
                ON p.id = pp.product_id
            WHERE pp.promotion_id = ?
            `,
      [id],
    );
    return {
      ...rows[0],
      products,
    };
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM promotions
            WHERE company_id = ?
            ORDER BY id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async findActiveForProduct(company_id, product_id) {
    const [rows] = await db.execute(
      `
            SELECT p.*
            FROM promotions p
            INNER JOIN promotion_products pp
                ON pp.promotion_id = p.id
            WHERE p.company_id = ?
            AND pp.product_id = ?
            AND p.status = 'active'
            AND p.start_date <= NOW()
            AND (
                p.end_date IS NULL
                OR p.end_date >= NOW()
            )
            AND (
                p.usage_limit IS NULL
                OR p.usage_count < p.usage_limit
            )
            ORDER BY p.value DESC
            `,
      [company_id, product_id],
    );
    return rows;
  }

  static async incrementUsage(id, company_id) {
    return await db.execute(
      `
            UPDATE promotions
            SET usage_count = usage_count + 1
            WHERE id = ?
            AND company_id = ?
            `,
      [id, company_id],
    );
  }

  static async updateStatus(id, company_id, status) {
    return await db.execute(
      `
            UPDATE promotions
            SET status = ?
            WHERE id = ?
            AND company_id = ?
            `,
      [status, id, company_id],
    );
  }
}
