import { db } from "../../../../../../database/MySQL/MySQL.js";

export class RestaurantBilling {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static async getOrderBill(order_id, company_id) {
    const [orderRows] = await db.execute(
      `
            SELECT
                ro.*,

                rt.table_number,
                rt.name AS table_name

            FROM restaurant_orders ro

            LEFT JOIN restaurant_tables rt
                ON rt.id = ro.table_id
                AND rt.company_id = ro.company_id
            
            WHERE ro.id = ?
            AND ro.company_id = ?
            LIMIT 1
            `,
      [order_id, company_id],
    );

    if (!orderRows.length) return null;

    const order = orderRows[0];
    const [items] = await db.execute(
      `
            SELECT
                roi.*,

                p.name AS product_name,
                p.barcode AS product_code

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

    const subtotal = items.reduce((sum, item) => {
      (sum + Number(item.subtotal || 0), 0);
    });

    const tax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);

    const discount = items.reduce(
      (sum, item) => sum + Number(item.discount || 0),
      0,
    );

    const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

    return {
      order,
      items,
      totals: {
        subtotal,
        tax,
        discount,
        total,
      },
    };
  }

  static async findSaleByOrder(order_id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM sales
            WHERE company_id = ?
            AND reference_type = 'restaurant_order'
            AND reference_id = ?
            LIMIT 1
            `,
      [company_id, order_id],
    );
    return rows.length ? rows[0] : null;
  }

  static async getSalePayments(sale_id, company_id) {
    const [rows] = await db.execute(
      `
            SELECT *
            FROM cash_movements
            WHERE company_id = ?
            AND reference_type = 'sale'
            AND reference_id = ?
            AND movement_type = 'income'
            ORDER BY id ASC
            `,
      [company_id, sale_id],
    );
    return rows;
  }

  static async getPaymentSummary(order_id, company_id) {
    const sale = await this.findSaleByOrder(order_id, company_id);
    if (!sale)
      return {
        sale: null,
        total: 0,
        paid: 0,
        pending: 0,
        status: "pending",
      };

    const payments = await this.getSalePayments(sale.id, company_id);

    const paid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const total = Number(sale.total || 0);

    const pending = Math.max(total - paid, 0);

    let status = "pending";

    if (paid > 0 && paid < total) {
      status = "partial";
    }

    if (paid >= total) {
      status = "paid";
    }

    return {
      sale,
      payments,
      total,
      paid,
      pending,
      status,
    };
  }

  static async validateCheckout(order_id, company_id) {
    const bill = await this.getOrderBill(order_id, company_id);
    if (!bill) throw new Error("Orden no encontrada");

    const order = bill.order;
    if (!["served", "ready"].includes(order.status))
      throw new Error("La orden todavia no esta lista para cobro");

    if (!bill.items.length)
      throw new Error("La orden no tiene productos cobrables");

    const paymentSummary = await this.getPaymentSummary(order_id, company_id);
    if (paymentSummary.status === "paid")
      throw new Error("La orden ya se encuentra pagada");

    return {
      bill,
      paymentSummary,
    };
  }
}
