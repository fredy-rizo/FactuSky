import { db } from "../../../../../database/MySQL/MySQL.js";

export class CashClosure {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { company_id, cash_opening_id, user_id, counted_amount, notes } =
        this;

      const [openingRows] = await connection.execute(
        `
        SELECT *
        FROM cash_openings
        WHERE id = ?
        AND company_id = ?
        AND status = 'open'
        LIMIT 1
        `,
        [cash_opening_id, company_id],
      );

      if (!openingRows.length)
        throw new Error("La apertura no existe o ya esta cerrada");

      const opening = openingRows[0];

      const [movementRows] = await connection.execute(
        `
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN movement_type = 'income'
                  THEN amount
                  ELSE 0
                END
              ),
              0
            ) AS total_income,

            COALESCE(
              SUM(
                CASE
                  WHEN movement_type = 'expense'
                  THEN amount
                  ELSE 0
                END
              ),
              0
            ) AS total_expense

          FROM cash_movements
          WHERE cash_opening_id = ?
          AND company_id = ?
        `,
        [cash_opening_id, company_id],
      );

      const total_income = Number(movementRows[0].total_income);
      const total_expense = Number(movementRows[0].total_expense);
      const opening_amount = Number(opening.opening_amount);
      const expected_amount = opening_amount + total_income - total_expense;
      const counted = Number(counted_amount);
      const difference = counted - expected_amount;

      const [closureResult] = await connection.execute(
        `
                INSERT INTO cash_closures
                (
                    company_id,
                    cash_opening_id,
                    user_id,
                    opening_amount,
                    total_income,
                    total_expense,
                    expected_amount,
                    counted_amount,
                    difference,
                    notes
                )
                VALUES(?,?,?,?,?,?,?,?,?,?)
                `,
        [
          company_id,
          cash_opening_id,
          user_id || null,
          opening_amount,
          total_income,
          total_expense,
          expected_amount,
          counted,
          difference,
          notes || null,
        ],
      );

      await connection.execute(
        `
                UPDATE cash_openings
                SET status = 'closed'
                WHERE id = ?
                AND company_id = ?
                AND status = 'open'
                `,
        [cash_opening_id, company_id],
      );

      await connection.commit();
      return await CashClosure.findById(closureResult.insertId, company_id);
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
        cc.*,
        co.cash_register_id,
        cr.name AS cash_register_name
      FROM cash_closures cc
      INNER JOIN cash_openings co
        ON co.id = cc.cash_opening_id
      INNER JOIN cash_registers cr
        ON cr.id = co.cash_register_id
      WHERE cc.id = ?
      AND cc.company_id = ?
      LIMIT 1
    `,
      [id, company_id],
    );

    return rows.length ? rows[0] : null;
  }

  static async findByOpening(cash_opening_id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM cash_closures
            WHERE cash_opening_id = ?
            AND company_id = ?
            LIMIT 1
            `,
      [cash_opening_id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
            SELECT
                cc.*,
                co.cash_register_id,
                cr.name AS cash_register_name
            FROM cash_closures cc
            INNER JOIN cash_openings co
                ON co.id = cc.cash_opening_id
            INNER JOIN cash_registers cr
                ON cr.id = co.cash_register_id
            WHERE cc.company_id = ?
            ORDER BY cc.id DESC
            `,
      [company_id],
    );
    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
            SELECT COUNT(*) AS total
            FROM cash_closures
            WHERE company_id = ?
            `,
      [company_id],
    );

    return rows[0].total;
  }
}
