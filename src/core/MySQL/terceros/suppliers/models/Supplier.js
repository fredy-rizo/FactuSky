import { db } from "../../../../../database/MySQL/MySQL.js";

export class Supplier {
  constructor({
    id = null,
    company_id,
    document_type,
    document_number,
    first_name,
    last_name,
    business_name,
    email,
    phone,
    address,
    city,
    state,
    country = "Colombia",
    notes,
    active = true,
  }) {
    ((this.id = id),
      (this.company_id = company_id),
      (this.document_type = document_type),
      (this.document_number = document_number),
      (this.first_name = first_name),
      (this.last_name = last_name),
      (this.business_name = business_name),
      (this.email = email),
      (this.phone = phone),
      (this.address = address),
      (this.city = city),
      (this.state = state),
      (this.country = country),
      (this.notes = notes),
      (this.active = active));
  }

  async save() {
    const [result] = await db.execute(
      `
            INSERT INTO suppliers
            (
                company_id,
                document_type,
                document_number,
                first_name,
                last_name,
                business_name,
                email,
                phone,
                address,
                city,
                state,
                country,
                notes,
                active
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `,
      [
        this.company_id,
        this.document_type || null,
        this.document_number || null,
        this.first_name || null,
        this.last_name || null,
        this.business_name || null,
        this.email || null,
        this.phone || null,
        this.address || null,
        this.city || null,
        this.state || null,
        this.country,
        this.notes || null,
        this.active,
      ],
    );
    this.id = result.insertId;
    return this;
  }

  static async findById(id, company_id) {
    const [rows] = await db.execute(
      `
        SELECT * 
        FROM suppliers
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        `,
      [id, company_id],
    );
    return rows[0];
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
        SELECT *
        FROM suppliers
        WHERE company_id = ?
        ORDER BY id DESC
        `,
      [company_id],
    );
    return rows;
  }

  static async findByDocument(company_id, document_number) {
    cons[rows] = await db.execute(
      `
        SELECT *
        FROM suppliers
        WHERE company_id = ?
        AND document_number = ?
        LIMIT 1
        `,
      [company_id, document_number],
    );
    return rows[0];
  }

  static async findByDocument(company_id, document_number) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM suppliers
      WHERE company_id = ?
      AND document_number = ?
      LIMIT 1
      `,
      [company_id, document_number],
    );

    return rows[0];
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
        SELECT COUNT(*) AS total
        FROM suppliers
        WHERE company_id = ?
        `,
      [company_id],
    );
    return rows[0].total;
  }

  static async update(id, company_id, data) {
    const {
      document_type,
      document_number,
      first_name,
      last_name,
      business_name,
      email,
      phone,
      address,
      city,
      state,
      country,
      notes,
      active,
    } = data;

    const [result] = await db.execute(
      `
      UPDATE suppliers
      SET
        document_type = ?,
        document_number = ?,
        first_name = ?,
        last_name = ?,
        business_name = ?,
        email = ?,
        phone = ?,
        address = ?,
        city = ?,
        state = ?,
        country = ?,
        notes = ?,
        active = ?
      WHERE id = ?
      AND company_id = ?
      `,
      [
        document_type || null,
        document_number || null,
        first_name || null,
        last_name || null,
        business_name || null,
        email || null,
        phone || null,
        address || null,
        city || null,
        state || null,
        country || "Colombia",
        notes || null,
        active,
        id,
        company_id,
      ],
    );

    return result;
  }

  static async delete(id, company_id) {
    const [result] = await db.execute(
      `
      DELETE FROM suppliers
      WHERE id = ?
      AND company_id = ?
      `,
      [id, company_id],
    );

    return result;
  }
}
