import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantReservation {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        company_id,
        customer_id,
        table_id,
        reservation_date,
        reservation_time,
        party_size,
        customer_name,
        customer_phone,
        notes,
        status = "pending",
        user_id,
      } = this;

      if (!company_id) throw new Error("company_id es requerido");
      if (!reservation_date) throw new Error("reservation_date es requerido");
      if (!reservation_time) throw new Error("reservation_time es requerido");
      if (!party_size || Number(party_size) <= 0)
        throw new Error("party_size es requerido y debe ser mayor que cero");

      if (table_id) {
        const [conflicts] = await connection.execute(
          `
                    SELECT id
                    FROM restaurant_reservations
                    WHERE company_id = ?
                    AND table_id = ?
                    AND reservation_date = ?
                    AND reservation_time = ?
                    AND status IN ('pending', 'confirmed', 'arrived')
                    LIMIT 1
                    `,
          [company_id, table_id, reservation_date, reservation_time],
        );

        if (conflicts.length)
          throw new Error("La mesa ya tiene una reserva para esa fecha y hora");
      }

      const [result] = await connection.execute(
        `
        INSERT INTO restaurant_reservations
        (
          company_id,
          customer_id,
          table_id,
          reservation_date,
          reservation_time,
          party_size,
          customer_name,
          customer_phone,
          notes,
          status,
          user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          customer_id || null,
          table_id || null,
          reservation_date,
          reservation_time,
          party_size,
          customer_name || null,
          customer_phone || null,
          notes || null,
          status,
          user_id || null,
        ],
      );

      const reservation_id = result.insertId;
      await connection.commit();
      return await RestaurantReservation.findById(reservation_id, company_id);
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
        rr.*,

        rt.table_number,
        rt.name AS table_name,

        c.name AS customer_name_general

      FROM restaurant_reservations rr

      LEFT JOIN restaurant_tables rt
        ON rt.id = rr.table_id
        AND rt.company_id = rr.company_id
      
      LEFT JOIN customers c
        ON c.id = rr.customer_id
      
      WHERE rr.id = ?
      AND rr.company_id = ?

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
        rr.*,

        rt.table_number,
        rt.name AS table_name

      FROM restaurant_reservations rr

      LEFT JOIN restaurant_tables rt
        ON rt.id = rr.table_id
        AND rt.company_id = rr.company_id

      WHERE rr.company_id = ?

      ORDER BY
        rr.reservation_date DESC,
        rr.reservation_time DESC,
        rr.id DESC
      `,
      [company_id],
    );
    return rows;
  }

  static async findByDate(company_id, reservation_date) {
    const [rows] = await db.execute(
      `
      SELECT
        rr.*,

        rt.table_number,
        rt.name AS table_name

      FROM restaurant_reservations rr

      LEFT JOIN restaurant_tables rt
        ON rt.id =  rr.table_id
        AND rt.company_id = rr.company_id

      WHERE rr.company_id = ?
      AND rr.reservation = ?

      ORDER BY rr.reservation_time ASC
      `,
      [company_id, reservation_date],
    );
    return rows;
  }

  static async findByTable(company_id, table_id, reservation_date) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM restaurant_reservations

      WHERE company_id = ?
      AND table_id = ?
      AND reservation_date = ?

      ORDER BY reservation_time ASC
      `,
      [company_id, table_id, reservation_date],
    );
    return rows;
  }

  static async checkAvailability(
    company_id,
    reservation_date,
    reservation_time,
    party_size,
    table_id = null,
  ) {
    const params = [company_id, reservation_date, reservation_time];

    let tableCondition = "";
    if (table_id) {
      tableCondition = ` AND rt.id = ?`;

      params.push(table_id);
    }

    const [tables] = await db.execute(
      `
      SELECT
        rt.*

      FROM restaurant_tables rt

      WHERE rt.company_id = ?
      AND rt.active = 1
      AND rt.capaty >= ?

      AND rt.id NOT IN
      (
        SELECT rr.table_id

        FROM restaurant_resertions rr

        WHERE rr.company_id = ?
        AND rr.reservation_date = ?
        AND rr.reservation_time = ?
        AND rr.table_id IS NOT NULL
        AND rr.status IN
          ('pending','confirmed','arrived')
      )
        ${tableCondition}
        ORDER BY rt.capacity ASC
      `,
      [
        company_id,
        party_size,
        company_id,
        reservation_date,
        reservation_time,
        ...(table_id ? [table_id] : []),
      ],
    );

    return tables;
  }

  static async update(id, company_id, data) {
    const {
      customer_id,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      customer_name,
      customer_phone,
      notes,
    } = data;

    const [currentRows] = await db.execute(
      `
      SELECT *
      FROM restaurant_reservations
      WHERE id = ?
      AND company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );

    if (!currentRows.length) throw new Error("Reserva no encontrada");

    const current = currentRows[0];
    if (!["pending", "confirmed"].includes(current.status))
      throw new Error("Esta reserva ya no puede modificarse");

    if (!table_id) {
      const [conflicts] = await db.execute(
        `
        SELECT id
        FROM restaurant_reservations

        WHERE company_id = ?
        AND table_id = ?
        AND reservation_date = ?
        AND status IN
          ('pending','confirmed','arrived')
        AND id != ?
        LIMIT 1
        `,
        [company_id, table_id, reservation_date, reservation_time, id],
      );

      if (conflicts.length)
        throw new Error("La mesa ya esta reservada para esa fecha y hora");

      const [result] = await db.execute(
        `
        UPDATE restaurant_reservations
        SET
          customer_id = ?,
          table_id = ?,
          reservation_date = ?,
          reservation_time = ?,
          party_size = ?,
          customer_id = ?,
          customer_phone = ?,
          notes = ?

        WHERE id = ?
        AND company_id = ?
        `,
        [
          customer_id || null,
          table_id || null,
          reservation_date,
          reservation_time,
          party_size,
          customer_name || null,
          customer_phone || null,
          notes || null,
          id,
          company_id,
        ],
      );
      return result;
    }
  }

  static async confirm(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_reservations
      
      SET status = 'confirmed'

      WHERE id = ?
      AND company_id = ?
      AND status = 'pending'
      `,
      [id, company_id],
    );
    return result;
  }

  static async arrive(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_reservations

      SET status = 'arrived'

      WHERE id = ?
      AND company_id = ?
      AND status = 'confirmed'
      `,
      [id, company_id],
    );
    return result;
  }

  static async cancel(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_reservations
      SET status = 'cancelled'
      WHERE id = ?
      AND company_id = ?
      AND status IN
        ('pending','confirmed')
      `,
      [id, company_id],
    );
    return result;
  }

  static async noShow(id, company_id) {
    const [result] = await db.execute(
      `
      UPDATE restaurant_reservations
      SET status = 'no_show'
      WHERE id = ?
      AND company_id = ?
      AND status = 'confirmed'
      `,
      [id, company_id],
    );
    return result;
  }
}
