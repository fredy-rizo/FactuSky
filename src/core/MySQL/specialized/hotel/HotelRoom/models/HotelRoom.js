import { db } from "../../../../../../database/MySQL/MySQL.js";

export class HotelRoom {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const {
      company_id,
      room_type_id,
      room_number,
      floor,
      custom_price,
      status = "available",
      notes,
    } = this;

    const [result] = await db.execute(
      `
            INSERT INTO hotel_rooms
            (
                company_id,
                room_type_id,
                room_number,
                floor,
                custom_price,
                status,
                notes
            )
            VALUES(?,?,?,?,?,?,?)
            `,
      [
        company_id,
        room_type_id,
        room_number,
        floor || null,
        custom_price || null,
        status,
        notes || null,
      ],
    );

    return await HotelRoom.findById(result.insertId, company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                hr.*,
                hrt.name AS room_type_name,
                hrt.base_price AS type_base_price,
                hrt.capacity AS type_capacity,
                (
                    SELECT COUNT(*)
                    FROM hotel_reservations hrs
                    WHERE hrs.room_id = hr.id
                    AND hrs.company_id = hr.company_id
                    AND hrs.status IN ("pending", "confirmed", "checked_in")
                    AND hrs.check_in_date <= CURDATE()
                    AND hrs.check_out_date > CURDATE()
                ) AS active_reservations_count
            FROM hotel_rooms hr
            INNER JOIN hotel_room_types hrt
                ON hrt.id = hr.room_type_id
                AND hrt.company_id = hr.company_id
            WHERE hr.id = ?
            AND hr.company_id = ?
            LIMIT 1
            `,
      [id, company_id],
    );

    if (!rows.length) return null;

    const room = rows[0];
    return {
      id: room.id,
      company_id: room.company_id,
      room_type_id: room.room_type_id,
      room_type_name: room.room_type_name,
      room_number: room.room_number,
      floor: room.floor,
      custom_price: room.custom_price ? Number(room.custom_price) : null,
      effective_price: Number(room.custom_price || room.type_base_price),
      type_base_price: Number(room.type_base_price),
      capacity: room.type_capacity,
      status: room.status,
      notes: room.notes,
      created_at: room.created_at,
      updated_at: room.updated_at,
      active_reservations_count: Number(room.active_reservations_count || 0),
    };
  }

  static async findAll(company_id, skip = 0, limit = 20, filters = {}) {
    const { status, room_type_id, floor } = filters;

    let query = `
        SELECT
            hr.*,
            hrt.name AS room_type_name,
            hrt.base_price AS type_base_price,
            hrt.capacity AS type_capacity
        FROM hotel_rooms hr
        INNER JOIN hotel_room_types hrt
            ON hrt.id = hr.room_type_id
            AND hrt.company_id = hr.company_id
        WHERE hr.company_id = ?
        `;

    const params = [company_id];

    if (status) {
      query += ` AND hr.status = ?`;
      params.push(status);
    }

    if (room_type_id) {
      query += ` AND hr.room_type_id = id`;
      params.push(room_type_id);
    }

    if (floor) {
      query += ` AND hr.floor = ?`;
      params.push(floor);
    }

    query += `
        ORDER BY
            CASE
                WHEN hr.status = 'available' THEN 1
                WHEN hr.status = 'cleaning' THEN 2
                WHEN hr.status = 'maintenance' THEN 3
                WHEN hr.status = 'occupied' THEN 4
                ELSE 5
            END,
            hr.room_number ASC
        LIMIT ? OFFSET ?
        `;

    params.push(Number(limit), Number(skip));
    const [rows] = await db.execute(query, params);

    return rows.map((room) => ({
      ...room,
      custom_price: room.custom_price ? Number(room.custom_price) : null,
      effective_price: Number(room.custom_price || room.type_base_price),
      type_base_price: Number(room.type_base_price),
      capacity: room.type_capacity,
    }));
  }

  static async count(company_id, filters = {}) {
    const { status, room_type_id, floor } = filters;

    let query = `
    SELET COUNT(*) AS count
    FROM hotel_rooms
    WHERE company_id = ?
    `;

    const params = [company_id];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (room_type_id) {
      query += ` AND room_type_id = ?`;
      params.push(room_type_id);
    }

    if (floor) {
      query += ` AND floor = ?`;
      params.push(floor);
    }

    const [rows] = await db.execute(query, params);
    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const { room_type_id, room_number, floor, custom_price, notes } = data;

    const [result] = await db.execute(
      `
        UPDATE hotel_rooms
        SET
            room_type_id = ?,
            room_number = ?,
            floor = ?,
            custom_price = ?,
            notes = ?
        WHERE id = ?
        AND company_id = ?
        `,
      [
        room_type_id,
        room_number,
        floor || null,
        custom_price || null,
        notes || null,
        id,
        company_id,
      ],
    );
    return result;
  }

  static async changeStatus(id, company_id, status) {
    const validStatuses = ["available", "occupied", "maintenance", "cleaning"];

    if (!validStatuses.includes(status))
      throw new Error(
        `Estado invalido. Debe ser uno de - ${validStatuses.join(", ")}`,
      );

    const [result] = await db.execute(
      `
        UPDATE hotel_rooms
        SET status = ?
        WHERE id = ?
        AND company_id = ?
        `,
      [status, id, company_id],
    );
    return result;
  }

  static async deactive(id, company_id) {
    const [room] = await db.execute(
      `
        SELECT status
        FROM hotel_rooms
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        `,
      [id, company_id],
    );

    if (!room.length) throw new Error("Habitacion no encontrada");

    if (room[0].status === "occupied")
      throw new Error("No se puede desactivar una habitacion que esta ocupada");

    const [result] = await db.execute(
      `
        UPDATE hotel_rooms
        SET status = 'maintenance'
        WHERE id = ?
        AND company_id = ?
        `,
      [id, company_id],
    );
    return result;
  }

  static async existsRoomNumber(company_id, room_number, exclude_id = null) {
    let query = `
    SELECT id
    FROM hotel_rooms
    Where company_id = ?
    AND room_number = ?
    `;

    const params = [company_id, room_number];
    if (exclude_id) {
      query += ` AND id != ?`;
      params.push(exclude_id);
    }

    query += ` LIMIT 1`;

    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  static async isAvailable(id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT id
        FROM hotel_rooms
        WHERE id = ?
        AND company_id = ?
        AND status = 'available'
        LIMIT 1
        `,
      [id, company_id],
    );

    return rows.length > 0;
  }

  static async validateRoomType(room_type_id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT id, name, active
        FROM hotel_room_types
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        `,
      [room_type_id, company_id],
    );

    if (!rows.length)
      throw new Error("El tipo de habitacion no existe para esta empresa");
    if (!rows[0].active)
      throw new Error(
        `El tipo de habitacion "${rows[0].name}" esta desactivado`,
      );

    return rows[0];
  }

  static async getStatistics(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        COUNT(*) AS total,
        SUM(status = 'available') AS available,
        SUM(status = 'occupied') AS occupied,
        SUM(status = 'maintenance') AS maintenance,
        SUM(status = 'cleaning') AS cleaning,
        AVG(COALESCE(custom_price, hrt.base_price)) AS avg_price,
        MIN(COALESCE(custom_price, hrt.base_price)) AS min_price,
        MAX(COALESCE(custom_price, hrt.base_price)) AS max_price
      FROM hotel_rooms hr
      INNER JOIN hotel_room_types hrt
        ON hrt.id = hr.room_type_id
        AND hrt.company_id = hr.company_id
      WHERE hr.company_id = ?
      `,
      [company_id],
    );

    const stats = rows[0];
    return {
      total: Number(stats.total || 0),
      available: Number(stats.available || 0),
      occupied: Number(stats.occupied || 0),
      maintenance: Number(stats.maintenance || 0),
      cleaning: Number(stats.cleaning || 0),
      avg_price: Number(stats.avg_price || 0),
      min_price: Number(stats.min_price || 0),
      max_price: Number(stats.max_price || 0),
      occupancy_rate: stats.total
        ? Number(
            ((Number(stats.occupied || 0) / Number(stats.total)) * 100).toFixed(
              2,
            ),
          )
        : 0,
    };
  }

  static async getFloors(company_id) {
    const [rows] = await db.execute(
      `
      SELECT DISTINCT floor
      FROM hotel_rooms
      WHERE company_id = ?
      AND floor IS NOT NULL
      AND floor != ''
      ORDER BY floor ASC
      `,
      [company_id],
    );
    return rows.map((r) => r.floor);
  }

  static async findAvailableByDateRange(
    company_id,
    check_in_date,
    check_out_date,
    room_type_id = null,
  ) {
    let query = `
    SELECT
      hr.*,
      hrt.name AS room_type_name,
      hrt.base_price AS type_base_price,
      hrt.capacity AS type_capacity,
      COALESCE(hr.custom_price, hrt.base_price) AS effective_price
    FROM hotel_rooms hr
    INNER JOIN hotel_room_types hrt
      ON hrt.id = hr.room_type_id
      AND hrt.company_id = hr.company_id
    WHERE hr.company_id = ?
    AND hr.status = 'available'
    AND NOT EXISTS(
      SELECT 1
      FROM hotel_reservations hrs
      WHERE hrs.room_id = hr.id
      AND hrs.company_id = hr.company_id
      AND hrs.status IN ('pending', 'confirmed','checked_id')
      AND hrs.check_in_date < ?
      AND hrs.check_out_date > ?
    )
    AND NOT EXISTS (
      SELECT 1
      FROM hotel_stays hs
      INNER JOIN hotel_reservations hrs ON hrs.id = hs.reservation_id
      WHERE hs.room_id = hr.id
      AND hrs.company_id = hr.company_id
      AND hs.status = 'active'
      AND hs.actual_check_in < ?
      AND (hs.actual_check_out IS NULL OR hs.actual_check_out > ?)
    )
    `;
    const params = [
      company_id,
      check_out_date,
      check_in_date,
      check_out_date,
      check_in_date,
    ];

    if (room_type_id) {
      query += ` AND hr.room_type_id = ?`;
      params.push(room_type_id);
    }

    query += `
    ORDER BY
      effective_pice ASC,
      hr.room_number aSC
    `;

    const [rows] = await db.execute(query, params);
    return rows.map((room) => ({
      ...room,
      custom_price: room.custom_price ? Number(room.custom_price) : null,
      effective_price: Number(room.effective_price),
      type_base_price: Number(room.type_base_price),
      capacity: room.type_capacity,
    }));
  }
}
