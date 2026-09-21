import crypto from "crypto";
import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantQrCode {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static async generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { company_id, table_id, created_by } = this;

      if (!company_id) {
        throw new Error("company_id es requerido");
      }

      if (!table_id) {
        throw new Error("table_id es requerido");
      }

      const [tables] = await connection.execute(
        `
        SELECT *
        FROM restaurant_tables
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        `,
        [table_id, company_id],
      );

      if (!tables.length) {
        throw new Error("La mesa no existe");
      }

      const [existing] = await connection.execute(
        `
          SELECT *
          FROM restaurant_qr_codes

          WHERE company_id = ?
          AND table_id = ?
          AND status = 'active'

          LIMIT 1
          `,
        [company_id, table_id],
      );

      if (existing.length) {
        throw new Error("La mesa ya tiene un QR activo");
      }

      const token = await RestaurantQrCode.generateToken();

      const [result] = await connection.execute(
        `
          INSERT INTO restaurant_qr_codes
          (
            company_id,
            table_id,
            token,
            status,
            created_by
          )
          VALUES (?, ?, ?, 'active', ?)
          `,
        [company_id, table_id, token, created_by || null],
      );

      await connection.commit();

      return await RestaurantQrCode.findById(result.insertId, company_id);
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
                qr.*,

                rt.table_number,
                rt.name AS table_name,
                rt.capacity

            FROM restaurant_qr_codes qr

            INNER JOIN restaurant_tables rt
                ON rt.id = qr.table_id
                AND rt.company_id = qr.company_id

            WHERE qr.id = ?
            AND qr.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                qr.*,

                rt.table_number,
                rt.name AS table_name,
                rt.capacity

            FROM restaurant_qr_codes qr

            INNER JOIN restaurant_tables rt
                ON rt.id = qr.table_id
                AND rt.company_id = qr.company_id

            WHERE qr.company_id = ?
            ORDER BY qr.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async findByTable(company_id, table_id) {
    const [rows] = await db.execute(
      `
        SELECT
          qr.*,

          rt.table_number,
          rt.name AS table_name,
          rt.capacity

        FROM restaurant_qr_codes qr

        INNER JOIN restaurant_tables rt
          ON rt.id = qr.table_id
          AND rt.company_id = qr.company_id

        WHERE qr.company_id = ?
        AND qr.table_id = ?

        ORDER BY qr.id DESC
        `,
      [company_id, table_id],
    );

    return rows;
  }

  static async findActiveByTable(company_id, table_id) {
    const [rows] = await db.execute(
      `
      SELECT
        qr.*,

        rt.table_number,
        rt.name AS table_name,
        rt.capacity

      FROM restaurant_qr_codes qr

      INNER JOIN restaurant_tables rt
        ON rt.id = qr.table_id
        AND rt.company_id = qr.company_id

      WHERE qr.company_id = ?
      AND qr.table_id = ?
      AND qr.status = 'active'
      LIMIT 1
      `,
      [company_id, table_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findByToken(token) {
    const [rows] = await db.execute(
      `
      SELECT
        qr.id,
        qr.company_id,
        qr.table_id,
        qr.token,
        qr.status,

        rt.table_number,
        rt.name AS table_name,
        rt.capacity

      FROM restaurant_qr_codes qr

      INNER JOIN restaurant_tables rt
        ON rt.id = qr.table_id
        AND rt.company_id = qr.company_id

      WHERE qr.token = ?
      AND qr.status = 'active'

      LIMIT 1
      `,
      [token],
    );
    return rows.length ? rows[0] : null;
  }

  static async deactive(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_qr_codes
      SET status = 'inactive'
      WHERE id = ?
      AND company_id = ?
      AND status = 'active'
      `,
      [id, company_id],
    );
    return result;
  }

  static async activate(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [qrRows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_qr_codes
        WHERE id = ?
        AND company_id = ?

        LIMIT 1
        `,
        [id, company_id],
      );

      if (!qrRows.length) throw new Error("Qr no encontrado");

      const qr = qrRows[0];
      const [active] = await connection.execute(
        `
        SELECT id
        FROM restaurant_qr_codes
        WHERE company_id = ?
        AND table_id = ?
        AND status = 'active'
        AND id != ?
        LIMIT 1
        `,
        [company_id, qr.table_id, id],
      );

      if (active.length) throw new Error("La mesa ya tiene otro QR activo");

      await connection.execute(
        `
        UPDATE restaurant_qr_codes
        SET status = 'active'
        WHERE id = ?
        AND company_id = ?
        `,
        [id, company_id],
      );

      await connection.commit();
      return await RestaurantQrCode.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async regenerate(id, company_id, created_by = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_qr_codes

        WHERE id = ?
        AND company_id = ?

        LIMIT 1
        `,
        [id, company_id],
      );

      if (!rows.length) throw new Error("Qr no encontrado");

      rows[0];
      const newToken = await RestaurantQrCode.generateToken();

      await connection.execute(
        `
        UPDATE restaurant_qr_codes

        SET
          token = ?,
          status = 'active',
          created_by = ?

        WHERE id = ?
        AND company_id = ?
        `,
        [newToken, created_by || null, id, company_id],
      );

      await connection.commit();
      return await RestaurantQrCode.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
