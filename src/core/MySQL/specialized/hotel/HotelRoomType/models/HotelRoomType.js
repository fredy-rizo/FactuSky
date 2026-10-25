import { db } from "../../../../../../database/MySQL/MySQL.js";

export class HotelRoomType {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const {
      company_id,
      name,
      description,
      base_price,
      capacity = 2,
      active = 1,
    } = this;

    const [result] = await db.execute(
      `
            INSERT INTO hotel_room_types
            (
                company_id,
                name,
                description,
                base_price,
                capacity,
                active 
            )
            VALUES(?,?,?,?,?,?)
            `,
      [company_id, name, description || null, base_price, capacity, active],
    );

    return await HotelRoomType.findById(result.insertId, company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                hrt.*,
                COUNT(hr.id) AS total_rooms,
                SUM(CASE WHEN hr.status = 'available' THEN 1 ELSE 0 END) AS available_rooms,
                SUM(CASE WHEN hr.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_rooms
            FROM hotel_room_types hrt
            LEFT JOIN hotel_rooms hr
                ON hr.room_type_id = hrt.id
                AND hr.company_id = hrt.company_id
            WHERE hrt.id = ?
            AND hrt.company_id = ?
            GROUP BY hrt.id
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!rows.length) return null;

    const type = rows[0];
    return {
      id: type.id,
      company_id: type.company_id,
      name: type.name,
      description: type.description,
      base_price: Number(type.base_price),
      capacity: type.capacity,
      active: type.active,
      created_at: type.created_at,
      update_at: type.update_at,
      statistics: {
        total_rooms: Number(type.total_rooms || 0),
        available_rooms: Number(type.available_rooms || 0),
        occupied_rooms: Number(type.occupied_rooms || 0),
      },
    };
  }

  static async findAll(company_id, skip = 0, limit = 20, active_only = false) {
    let query = `
        SELECT
            hrt.*,
            COUNT(hr.id) AS total_rooms,
            SUM(CASE WHEN hr.status = 'available' THEN 1 ELSE 0 END) AS available_rooms,
            SUM(CASE WHEN hr.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_rooms
        FROM hotel_room_types hrt
        LEFT JOIN hotel_rooms hr
            ON hr.room_type_id = hrt.id
            AND hr.company_id = hrt.company_id
        WHERE hrt.company_id = ?
        `;

    const params = [company_id];

    if (active_only) {
      query += ` AND hrt.active = 1`;
    }

    query += `
            GROUP BY hrt.id
            ORDER BY hrt.name ASC
            LIMIT ? OFFSET ?
        `;

    params.push(Number(limit), Number(skip));

    const [rows] = await db.execute(query, params);
    return rows.map((type) => ({
      ...type,
      base_price: Number(type.base_price),
      statistics: {
        total_rooms: Number(type.total_rooms || 0),
        available_rooms: Number(type.available_rooms || 0),
        occupied_rooms: Number(type.occupied_rooms || 0),
      },
    }));
  }

  static async count(company_id, active_only = false) {
    let query = `
        SELECT COUNT(*) AS count
        FROM hotel_room_types
        WHERE company_id = ?
        `;

    const params = [company_id];
    if (active_only) {
      query += ` AND active = 1`;
    }

    const [rows] = await db.execute(query, params);
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { name, description, base_price, capacity } = data;

    const [result] = await db.execute(
      `
      UPDATE hotel_room_types
      SET
        name = ?,
        description = ?,
        base_price = ?,
        capacity = ?
      WHERE id = ?
      AND company_id = ?
      `,
      [name, description || null, base_price, capacity, id, company_id],
    );
    return result;
  }

  static async deactive(id, company_id) {
    const [occupied] = await db.execute(
      `
      SELECT COUNT(*) AS count
      FROM hotel_rooms
      WHERE room_type_id = ?
      AND company_id = ?
      AND status IN ('occupied', 'cleaning')
      `,
      [id, company_id],
    );

    if (Number(occupied[0].count) > 0) {
      throw new Error(
        "No se puede desactivar el tipo de habitacion porque tiene habitaciones ocupadas o en limpieza",
      );
    }

    const [result] = await db.execute(
      `
      UPDATE hotel_room_types
      SET active = 0
      WHERE id = ?
      AND company_id = ?
      `,
      [id, company_id],
    );
    return result;
  }

  static async activate(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE hotel_room_types
      SET active = 1
      WHERE id = ?
      AND company_id = ?
      `,
      [id, company_id],
    );
    return result;
  }

  static async existsByName(company_id, name, exclude_id = null) {
    let query = `
      SELECT id
      FROM hotel_room_types
      WHERE company_id = ?
      AND name = ?
    `;

    const params = [company_id, name];
    if (exclude_id) {
      query += ` AND id != ?`;
      params.push(exclude_id);
    }

    query += ` LIMIT 1`;

    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  static async getStatistics(companny_id) {
    const [rows] = await db.execute(
      `
      SELECT
        COUNT(*) AS total_types,
        SUM(active = 1) as active_types,
        SUM(active = 0) AS inactive_types,
        AVG(base_price) AS avg_price,
        MIN(base_price) AS min_price,
        MAX(base_price) AS max_price,
        AVG(capacity) AS avg_capacity
      FROM hotel_room_types
      WHERE company_id = ?
      `,
      [companny_id],
    );

    const stats = rows[0];
    return {
      total_types: Number(stats.total_types || 0),
      active_types: Number(stats.active_types || 0),
      inactive_types: Number(stats.inactive_types || 0),
      avg_price: Number(stats.avg_price || 0),
      min_price: Number(stats.min_price || 0),
      max_price: Number(stats.max_price || 0),
      avg_capacity: Number(stats.avg_capacity || 0),
    };
  }
}
