import { db } from "../../../../../database/MySQL/MySQL.js";

export class CashMovement {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  async save() {
    const {
      company_id,
      cash_opening_id,
      user_id,
      movement_type,
      category = "other",
      amount,
      description,
      reference_type,
      reference_id,
      movement_date,
    } = this;

    if (Number(amount) <= 0)
      throw new Error("El valor del movimiento debe ser mayor que cero");

    const [opening] = await db.execute(
      `
      SELECT id
      FROM cash_openings
      WHERE id = ?
      AND company_id = ?
      AND status = 'open'
      LIMIT 1
      `,
      [cash_opening_id, company_id],
    );

    if (!opening.length)
      throw new Error("La apertura no existe o esta cerrada");

    const [result] = await db.execute(
      `
      INSERT INTO cash_movements
      (
        company_id,
        cash_opening_id,
        user_id,
        movement_type,
        category,
        amount,
        description,
        reference_type,
        reference_id,
        movement_date
      )
      VALUES(?,?,?,?,?,?,?,?,?,?)
      `,
      [
        company_id,
        cash_opening_id,
        user_id || null,
        movement_type,
        category,
        amount,
        description || null,
        reference_type || null,
        reference_id || null,
        movement_date || new Date(),
      ],
    );

    return await CashMovement.findById(result.insertId, company_id);
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM cash_movements
      WHERE id = ?
      AND company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async findAllByOpening(cash_opening_id, company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM cash_movements
      WHERE cash_opening_id = ?
      AND company_id = ?
      ORDER BY id ASC
      `,
      [cash_opening_id, company_id],
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

  static async sumary(cash_opening_id, company_id) {
    const [rows] = await db.execute(
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

    return {
      total_income: Number(rows[0].total_income),
      total_expense: Number(rows[0].total_expense),
    };
  }
}
