import { db } from "../../../../../database/MySQL/MySQL.js";

export class CashOpening {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        cash_register_id,
        user_id,
        opening_amount = 0,
        notes,
      } = this;

      const [activeOpening] = await connection.execute(
        `
                SELECT id
                FROM cash_openings
                WHERE cash_register_id = ?
                AND company_id = ?
                AND status = 'open'
                LIMIT 1
                `,
        [cash_register_id, company_id],
      );

      if (activeOpening.length) {
        throw new Error("La caja ya tiene una apertura activa");
      }

      const [register] = await connection.execute(
        `
                SELECT id
                FROM cash_registers
                WHERE id = ?
                AND company_id = ?
                AND status = 'active'
                LIMIT 1 
                `,
        [cash_register_id, company_id],
      );

      if (!register.length) {
        throw new Error("La caja no existe no esta inactiva");
      }

      const [result] = await db.execute(
        `
                INSERT INTO cash_openings
                (
                    company_id,
                    cash_register_id,
                    user_id,
                    opening_amount,
                    notes 
                )
                VALUES(?,?,?,?,?)
                `,
        [
          company_id,
          cash_register_id,
          user_id || null,
          opening_amount,
          notes || null,
        ],
      );

      await connection.commit();
      return await CashOpening.findById(result.insertId, company_id);
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
                co.*,
                cr.name AS cash_register_name
            FROM cash_openings co
            INNER JOIN cash_registers cr
                ON cr.id = co.cash_register_id
            WHERE co.id = ?
            AND co.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    return rows.length ? rows[0] : null;
  }

  static async current(cash_register_id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                co.*,
                cr.name AS cash_register_name
            FROM cash_openings co
            INNER JOIN cash_registers cr
                ON cr.id = co.cash_register_id
            WHERE co.cash_register_id = ?
            AND co.company_id = ?
            AND co.status = 'open'
            LIMIT 1
            `,
      [cash_register_id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                co.*,
                cr.name AS cash_register_name
            FROM cash_openings co
            INNER JOIN cash_registers cr
                ON cr.id = co.cash_register_id
            WHERE co.company_id = ?
            ORDER BY co.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS total
            FROM categories
            WHERE company_id = ?
            `,
      [company_id],
    );
    return rows[0].total;
  }
}
