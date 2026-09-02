import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantTable {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const {
      company_id,
      table_number,
      name,
      capacity = 2,
      status = "available",
      location,
      qr_token,
      notes,
    } = this;

    const [result] = await db.execute(
      `
            INSERT INTO restaurant_tables
            (
                company_id,
                table_number,
                name,
                capacity,
                status,
                location,
                qr_token,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
      [
        company_id,
        table_number,
        name || null,
        capacity,
        status,
        location || null,
        qr_token || null,
        notes || null,
      ],
    );

    return await RestaurantTable.findById(result.insertId, company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                rt.*,
                rts.id AS active_session_id,
                rts.guests AS active_session_guests,
                rts.opened_at AS active_session_opened_at,
                rts.opened_by AS active_session_opened_by
            FROM restaurant_tables rt
            LEFT JOIN restaurant_tables_sessions rts
                ON rts.table_id = rt.id
                AND rts.company_id = rt.company_id
                AND rts.status = 'open'
            WHERE rt.id = ?
            AND rt.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!rows.length) return null;
    const table = rows[0];
    return {
      id: table.id,
      company_id: table.company_id,
      table_number: table.table_number,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      location: table.location,
      qr_token: table.qr_token,
      notes: table.notes,
      created_at: table.created_at,
      updated_at: table.updated_at,
      active_session: table.active_session_id
        ? {
            id: table.active_session_id,
            guests: table.active_session_guests,
            opened_at: table.active_session_opened_at,
            opened_by: table.active_session_opened_by,
          }
        : null,
    };
  }

  static async findAll(company_id, skip = 0, limit = 20, status = null) {
    let query = `
            SELECT
                rt.*,
                rts.id AS active_session_id,
                rts.guests AS active_session_guests,
                rts.opened_at AS active_session_opened_at
            FROM restaurant_tables rt
            LEFT JOIN restaurant_table_sessions rts
                ON rts.table_id = rt.id
                AND rts.company_id = rt.company_id
                AND rt.status = 'open'
            WHERE rt.company_id = ?
        `;
    const params = [company_id];
    if (status) {
      query += ` AND rt.status = ?`;
      params.push(status);
    }

    query += `
            ORDER BY
                CASE
                    WHEN rt.status = 'available' THEN 1
                    WHEN rt.status = 'reserved' THEN 2
                    WHEN rt.status = 'occupied' THEN 3
                    ELSE 4
                END,
                rt.table_number ASC
            LIMIT ? OFFSET ?
        `;
    params.push(Number(limit), Number(skip));
    const [rows] = await db.execute(query, params);
    return rows.map((table) => ({
      ...table,
      active_session: table.active_session_id
        ? {
            id: table.active_session_id,
            guests: table.active_session_guests,
            opened_at: table.active_session_opened_at,
          }
        : null,
    }));
  }

  static async count(company_id, status = null) {
    let query = `
            SELECT COUNT(*) AS count
            FROM restaurant_tables
            WHERE company_id = ?
        `;

    const params = [company_id];
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    const [rows] = await db.execute(query, params);
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { table_number, name, capacity, location, notes } = data;

    const [result] = await db.execute(
      `
            UPDATE restaurant_tables
            SET
                table_number = ?,
               name = ?,
                capacity = ?,
               location = ?,
                notes = ?
            WHERE id = ?
            AND company_id = ?
            AND status != 'inactive'
            `,
      [
        table_number,
        name || null,
        capacity,
        location || null,
        notes || null,
        id,
        company_id,
      ],
    );
    return result;
  }

  static async changeStatus(id, company_id, status) {
    const [result] = await db.execute(
      `
        UPDATE restaurant_tables
        SET status = ?
        WHERE id = ?
        AND company_id = ?
        `,
      [status, id, company_id],
    );
    return result;
  }

  static async deactivate(id, company_id) {
    const [result] = await db.execute(
      `
        UPDATE restaurant_tables
        SET status = 'inactive'
        WHERE id = ?
        AND company_id = ?
        AND status != 'occupied'
        `,
      [id, company_id],
    );
    return result;
  }

  static async existsTableNumber(company_id, table_number, exclude_id = null) {
    let query = `
        SELECT id
        FROM restaurant_tables
        WHERE company_id = ?
        AND table_number = ?
    `;

    const params = [company_id, table_number];
    if (exclude_id) {
      query += ` AND id != ? `;
      params.push(exclude_id);
    }

    query += ` LIMIT 1 `;
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  static async isAvailable(id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT id
        FROM restaurant_tables
        WHERE id = ?
        AND company_id = ?
        AND status = 'available'
        LIMIT 1
        `,
      [id, company_id],
    );
    return rows.length > 0;
  }

  static async getStatistics(company_id) {
    const [rows] = await db.execute(
      `
        SELECT
            COUNT(*) AS total,
            SUM(status = 'available') AS available,
            SUM(status = 'occupied') AS occupied,
            SUM(status = 'reserved') AS reserved,
            SUM(status = 'inactive') AS inactive
        FROM restaurant_tables
        WHERE company_id = ?
        `,
      [company_id],
    );
    return {
      total: Number(rows[0].total || 0),
      available: Number(rows[0].available || 0),
      occupied: Number(rows[0].occupied || 0),
      reserved: Number(rows[0].reserved || 0),
      inactive: Number(rows[0].inactive || 0),
    };
  }
}
