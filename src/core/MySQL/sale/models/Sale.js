import { db } from "../../../../database/MySQL/MySQL.js";

export class Sale {
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
        warehouse_id,
        payment_method_id,
        invoice_number,
        sale_date,
        subtotal,
        tax,
        discount,
        total,
        status = "draft",
        payment_status = "pending",
        notes,
        user_id,
        items,
      } = this;

      const [saleResult] = await connection.execute(
        `
        INSERT INTO sales
        (
          company_id,
          customer_id,
          warehouse_id,
          payment_method_id,
          invoice_number,
          sale_date,
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes,
          user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company_id,
          customer_id || null,
          warehouse_id,
          payment_method_id || null,
          invoice_number || null,
          sale_date || new Date(),
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          notes || null,
          user_id || null,
        ],
      );

      const sale_id = saleResult.insertId;

      for (const item of items) {
        await connection.execute(
          `
          INSERT INTO sale_items
          (
            sale_id,
            product_id,
            quantity,
            unit_price,
            discount,
            tax,
            subtotal,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            sale_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.discount || 0,
            item.tax || 0,
            item.subtotal,
            item.total,
          ],
        );
      }

      await connection.commit();

      return await Sale.findById(sale_id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async confirm(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM sales
        WHERE id = ?
          AND company_id = ?
          AND status = 'draft'
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!saleRows || saleRows.length === 0) {
        await connection.rollback();
        throw new Error("Venta no encontrada o no está en draft");
      }

      const sale = saleRows[0];

      const [items] = await connection.execute(
        `
        SELECT product_id, quantity
        FROM sale_items
        WHERE sale_id = ?
        `,
        [id],
      );

      for (const item of items) {
        const [result] = await connection.execute(
          `
          UPDATE inventory
          SET quantity = quantity - ?
          WHERE product_id = ?
            AND warehouse_id = ?
            AND quantity >= ?
          `,
          [
            Number(item.quantity),
            item.product_id,
            sale.warehouse_id,
            Number(item.quantity),
          ],
        );

        if (result.affectedRows === 0) {
          throw new Error(
            `Inventario insuficiente para el producto ${item.product_id}`,
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE sales
        SET status = "confirmed"
        WHERE id = ?
          AND company_id = ?
          AND status = "draft"
        `,
        [id, company_id],
      );
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async findById(id, company_id) {
    const [saleRows] = await db.execute(
      `
      SELECT *
      FROM sales
      WHERE id = ?
      AND company_id = ?
      LIMIT 1
      `,
      [id, company_id],
    );

    if (!saleRows.length) return null;

    const [items] = await db.execute(
      `
      SELECT
        si.*,
        p.name AS product_name
      FROM sale_items si
      INNER JOIN products p
        ON p.id = si.product_id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
      `,
      [id],
    );

    return {
      ...saleRows[0],
      items,
    };
  }

  static async findAll(company_id) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM sales
      WHERE company_id = ?
      ORDER BY id DESC
      `,
      [company_id],
    );

    return rows;
  }

  static async count(company_id) {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS count
      FROM sales
      WHERE company_id = ?
      `,
      [company_id],
    );

    return Number(rows[0].count);
  }

  static async update(id, company_id, data) {
    const {
      customer_id,
      warehouse_id,
      payment_method_id,
      invoice_number,
      sale_date,
      notes,
      payment_status,
    } = data;

    const [result] = await db.execute(
      `
      UPDATE sales
      SET
        customer_id = ?,
        warehouse_id = ?,
        payment_method_id = ?,
        invoice_number = ?,
        sale_date = ?,
        notes = ?,
        payment_status = ?
      WHERE id = ?
      AND company_id = ?
      AND status = 'draft'
      `,
      [
        customer_id || null,
        warehouse_id,
        payment_method_id || null,
        invoice_number || null,
        sale_date,
        notes || null,
        payment_status || "pending",
        id,
        company_id,
      ],
    );

    return result;
  }

  static async cancel(id, company_id) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.execute(
        `
        SELECT warehouse_id, status
        FROM sales
        WHERE id = ?
          AND company_id = ?
          AND status IN('draft','confirmed')
        LIMIT 1
        `,
        [id, company_id],
      );

      if (!saleRows.length) {
        await connection.rollback();
        return null;
      }

      const sale = saleRows[0];

      if (sale.status === "confirmed") {
        const [items] = await connection.execute(
          `
          SELECT product_id, quantity
          FROM sales_items
          WHERE sale_id = ?
          `,
          [id],
        );

        for (const item of items) {
          await connection.execute(
            `
            UPDATE inventory
            SET quantity = quantity + ?
            WHERE product_id = ?
              AND warehouse_id = ?
              AND status IN('draft','confirmed')
            `,
            [Number(item.quantity), item.product_id, sale.warehouse_id],
          );
        }
      }

      const [result] = await connection.execute(
        `
        UPDATE sales
        SET status = 'cancelled'
        WHERE id = ?
          AND company_id = ?
          AND status IN('draft','confirmed')
        `,
        [id, company_id],
      );

      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async createFromRestaurantOrder(
    order_id,
    company_id,
    customer_id,
    user_id,
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.execute(
        `
        SELECT *
        FROM restaurant_orders
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [order_id, company_id],
      );

      if (!orderRows.length)
        throw new Error("Orden de restaurante no encontrada");

      const order = orderRows[0];
      if (!["served", "ready"].includes(order.status))
        throw new Error("La orden todavia no puede convertirse en venta");

      const [existingSale] = await connection.execute(
        `
        SELECT id
        FROM sales
        WHERE company_id = ?
        AND reference_type = 'restaurant_order'
        AND reference_id = ?
        `,
        [company_id, order_id],
      );

      if (existingSale.length)
        throw new Error("La orden ya tiene una venta asociada");

      const [items] = await connection.execute(
        `
        SELECT
          roi.*,
          p.name AS product_name
        FROM restaurant_order_items roi

        INNER JOIN products p
          ON p.id = roi.product_id
        
        WHERE roi.order_id = ?
        AND roi.company_id = ?
        AND roi.status != 'cancelled'
        ORDER BY roi.id ASC
        `,
        [order_id, company_id],
      );

      if (!items.length) throw new Error("La orden no tiene productos");

      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0,
      );
      const tax = items.reduce((sum, item) => Number(item.tax || 0), 0);
      const discount = items.reduce(
        (sum, item) => Number(item.discount || 0),
        0,
      );
      const total = items.reduce((sum, item) => Number(item.total || 0), 0);

      const [warehouseRows] = await connection.execute(
        `
        SELECT id
        FROM warehouses
        WHERE company_id = ?
        AND active = 1
        ORDER BY id ASC
        LIMIT 1
      `,
        [company_id],
      );

      if (!warehouseRows.length) {
        throw new Error(
          "La empresa no tiene una bodega activa para realizar la venta",
        );
      }

      const warehouse_id = warehouseRows[0].id;

      const [saleResult] = await connection.execute(
        `
        INSERT INTO sales
        (
          company_id,
          warehouse_id,
          customer_id,
          sale_date,
          subtotal,
          tax,
          discount,
          total,
          status,
          payment_status,
          user_id,
          reference_type,
          reference_id
        )
        VALUES
        (?, ?,?, NOW(), ?, ?, ?, ?, 'confirmed', 'pending', ?, 'restaurant_order', ?)
        `,
        [
          company_id,
          warehouse_id,
          customer_id || null,
          subtotal,
          tax,
          discount,
          total,
          user_id || null,
          order_id,
        ],
      );

      const sale_id = saleResult.insertId;
      for (const item of items) {
        await connection.execute(
          `
          INSERT INTO sale_items
          (
            sale_id,
            product_id,
            quantity,
            unit_price,
            discount,
            tax,
            subtotal,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            sale_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.discount || 0,
            item.tax || 0,
            item.subtotal,
            item.total,
          ],
        );
      }

      await connection.commit();
      return await Sale.findById(sale_id, company_id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async payRestaurantSale(
    sale_id,
    company_id,
    cash_opening_id,
    amount,
    payment_method_id,
    user_id,
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.execute(
        `
        SELECT *
        FROM sales
        WHERE id = ?
        AND company_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [sale_id, company_id],
      );

      if (!saleRows.length) {
        throw new Error("Venta no encontrada");
      }

      const sale = saleRows[0];

      if (sale.reference_type !== "restaurant_order") {
        throw new Error("La venta no corresponde a una orden de restaurante");
      }

      const [cashRows] = await connection.execute(
        `
        SELECT *
        FROM cash_openings
        WHERE id = ?
        AND company_id = ?
        AND status = 'open'
        LIMIT 1
        FOR UPDATE
        `,
        [cash_opening_id, company_id],
      );

      if (!cashRows.length) {
        throw new Error("La caja no está abierta");
      }

      const [paymentRows] = await connection.execute(
        `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS paid
        FROM cash_movements
        WHERE company_id = ?
        AND reference_type = 'sale'
        AND reference_id = ?
        AND movement_type = 'income'
        `,
        [company_id, sale_id],
      );

      const paid = Number(paymentRows[0].paid || 0);

      const total = Number(sale.total);

      const pending = total - paid;

      const paymentAmount = Number(amount);

      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error("El monto del pago debe ser mayor que cero");
      }

      if (paymentAmount > pending) {
        throw new Error(`El pago supera el saldo pendiente de ${pending}`);
      }

      await connection.execute(
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
        reference_id
      )
      VALUES
      (?, ?, ?, 'income', 'sale', ?, ?, 'sale', ?)
      `,
        [
          company_id,
          cash_opening_id,
          user_id || null,
          paymentAmount,
          `Pago venta restaurante #${sale_id}`,
          sale_id,
        ],
      );

      const newPaid = paid + paymentAmount;

      const paymentStatus = newPaid >= total ? "paid" : "partial";

      await connection.execute(
        `
      UPDATE sales
      SET payment_status = ?
      WHERE id = ?
      AND company_id = ?
      `,
        [paymentStatus, sale_id, company_id],
      );

      if (paymentStatus === "paid") {
        await connection.execute(
          `
        UPDATE restaurant_orders
        SET status = 'paid'
        WHERE id = ?
        AND company_id = ?
        `,
          [sale.reference_id, company_id],
        );
      }

      await connection.commit();

      return {
        sale_id,
        total,
        previous_paid: paid,
        payment: paymentAmount,
        paid: newPaid,
        pending: Math.max(total - newPaid, 0),
        payment_status: paymentStatus,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
