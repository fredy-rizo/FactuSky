import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantTableSession {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        table_id,
        customer_id,
        opened_by,
        guests = 1,
        notes,
      } = this;

      const [tableRows] = await connection.execute(
        `
                SELECT *
                FROM restaurant_tables
                WHERE id = ?
                AND company_id = ?
                FOR UPDATE
                `,
        [table_id, company_id],
      );

      if (!tableRows.length) throw new Error("Mesa no encontrada");

      const table = tableRows[0];
      if (table.status !== "available")
        throw new Error(
          `La mesa no esta disponible. Estado actual: ${table.status}`,
        );

      const [activeSessions] = await connection.execute(
        `
                SELECT id
                FROM restaurant_table_sessions
                WHERE table_id = ?
                AND company_id = ?
                AND status = 'open'
                LIMIT 1
                FOR UPDATE
                `,
        [table_id, company_id],
      );

      if (activeSessions.length)
        throw new Error("La mesa ya tiene una sesion abierta");

      const [sessionResult] = await connection.execute(
        `
                INSERT INTO restaurant_table_sessions
                (
                    company_id,
                    table_id,
                    customer_id,
                    opened_by,
                    status,
                    guests,
                    notes
                )
                VALUES (?,?,?,?, 'open', ?,?)
                `,
        [
          company_id,
          table_id,
          customer_id || null,
          opened_by || null,
          guests,
          notes || null,
        ],
      );

      const session_id = sessionResult.insertId;
      await connection.execute(
        `
                UPDATE restaurant_tables
                SET status = 'occupied'
                WHERE id = ?
                AND company_id = ?
                `,
        [table_id, company_id],
      );

      await connection.commit();
      return await RestaurantTableSession.findById(session_id, company_id);
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
                rts.*,
                rt.table_number,
                rt.name AS table_name,
                rt.capacity,
                c.first_name AS customer_name
            FROM restaurant_table_sessions rts
            INNER JOIN restaurant_tables rt
                ON rt.id = rts.table_id
                AND rt.company_id = rts.company_id
            LEFT JOIN customers c
                ON c.id = rts.customer_id
                AND c.company_id = rts.company_id
            WHERE rts.id = ?
            AND rts.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!rows.length) return null;
    return rows[0];
  }

  static async findActiveByTable(table_id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            rts.*,
            rt.table_number,
            rt.name AS table_name,
            rt.capacity,
            c.first_name AS customer_name
        FROM restaurant_table_sessions rts
        INNER JOIN restaurant_tables rt
            ON rt.id = rts.table_id
            AND rt.company_id = rts.company_id
        LEFT JOIN customers c
            ON c.id = rts.customer_id
            AND c.company_id = rts.company_id
        WHERE rts.table_id = ?
        AND rts.company_id = ?
        AND rts.status = 'open'
        LIMIT 1
        `,
      [table_id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id, skip = 0, limit = 20, status = null) {
    let query = `
        SELECT
            rts.*,
            rt.table_number,
            rt.name AS table_name,
            c.first_name AS customer_name
        FROM restaurant_table_sessions rts
        INNER JOIN restaurant_tables rt
            ON rt.id = rts.table_id
            AND rt.company_id = rts.company_id
        LEFT JOIN customers c
            ON c.id = rts.customer_id
            AND c.company_id = rts.company_id
        WHERE rts.company_id = ?
    `;
    const params = [company_id];
    if (status) {
      query += ` AND rts.status = ? `;
      params.push(status);
    }

    query += `
        ORDER BY rts.id DESC
        LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(skip));

    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async count(company_id, status = null) {
    let query = `
        SELECT COUNT(*) AS count
        FROM restaurant_table_sessions
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

  static async close(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      const [sessionRows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_table_sessions
        WHERE id = ?
        AND company_id = ?
        FOR UPDATE
        `,
        [id, company_id],
      );

      if (!sessionRows.length) throw new Error("Sesion no encontrada");

      const session = sessionRows[0];
      if (session.status !== "open") throw new Error("La sesion no abierta");

      // Cerrar sesion
      await connection.execute(
        `
        UPDATE restaurant_tables
        SET
          status = 'closed',
          closed_at = NOW()
        WHERE id = ?
        AND company_id = ?
        AND status = 'open'
        `,
        [id, company_id],
      );

      // Liberar mesa
      await connection.execute(
        `
        UPDATE restaurant_table_sessions
        SET
          status = 'closed'
          closed_at = NOW()
        WHERE id = ?
        AND company_id = ?
        AND status = 'open'
        `,
        [session.table_id, company_id],
      );

      await connection.commit();
      return await RestaurantTableSession.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async cancel(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [sessionRows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_table_sessions
        WHERE id = ?
        AND company_id = ?
        FOR UPDATE
        `,
        [id, company_id],
      );

      if (!sessionRows.length) throw new Error("Sesion no encontrada");

      const sesion = sessionRows[0];
      if (sesion.status !== "open")
        throw new Error("Solo se pueden cancelar sesiones abiertas");

      // Cancelar sesion
      await connection.execute(
        `
        UPDATE restaurant_table_sessions
        SET
          status = 'cancelled',
          closed_at = NOW()
        WHERE id = ?
        AND company_id = ?
        AND status = 'open'
        `,
        [id, company_id],
      );

      // Liberar mesa
      await connection.execute(
        `
        UPDATE restaurant_tables
        SET status = 'available'
        WHERE id = ?
        AND company_id = ?
        AND status = 'occupied'
        `,
        [sesion.table_id, company_id],
      );

      await connection.commit();
      return await RestaurantTableSession.findById(id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
