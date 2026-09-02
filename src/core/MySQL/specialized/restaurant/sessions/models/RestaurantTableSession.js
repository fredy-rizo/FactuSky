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
      if (table.status !== "availabe")
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
                rt.name AS table_number,
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
}
