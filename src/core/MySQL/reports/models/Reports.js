import { db } from "../../../../database/MySQL/MySQL.js";

export class Report {
  // Dashboard general

  static async dashboard(company_id, start_date, end_date) {
    const [
      [sales],
      [purchases],
      [expenses],
      [receivables],
      [payables],
      [lowStock],
      [topProducts],
    ] = await Promise.all([
      db.execute(
        `
                SELECT
                    COUNT(*) AS total_sales,
                    COALESCE(SUM(total), 0) AS total_amount
                FROM sales
                WHERE company_id = ?
                AND status NOT IN ('cancelled')
                AND sale_date >= ?
                AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
                `,
        [company_id, start_date, end_date],
      ),

      db.execute(
        `
                SELECT
                    COUNT(*) AS total_purchases,
                    COALESCE(SUM(total), 0) AS total_amount
                FROM purchases
                WHERE company_id = ?
                AND status NOT IN ('cancelled')
                AND purchase_date >= ?
                AND purchase_date < DATE_ADD(?, INTERVAL 1 DAY)
                `,
        [company_id, start_date, end_date],
      ),

      db.execute(
        `
                SELECT
                    COUNT(*) AS total_expenses,
                    COALESCE(SUM(total), 0) AS total_amount
                FROM expenses
                WHERE company_id = ?
                AND status != 'cancelled'
                AND expense_date >= ?
                AND expense_date < DATE_ADD(?, INTERVAL 1 DAY)
                `,
        [company_id, start_date, end_date],
      ),

      db.execute(
        `
                SELECT 
                    COUNT(*) AS total_accounts,
                    COALESCE(
                        SUM(total_amount - paid_amount),
                        0
                    ) AS pending_amount
                FROM accounts_receivable
                WHERE company_id = ?
                AND status NOT IN ('paid','cancelled')
                `,
        [company_id],
      ),

      db.execute(
        `
                SELECT
                    COUNT(*) AS total_accounts
                    COALESCE(
                        SUN(total_amount - paid_amount),
                        0
                    ) AS pending_amount
                FROM accounts_payable
                WHERE company_id = ?
                AND status NOT IN ('paid','cancelled')
                `,
        [company_id],
      ),

      db.execute(
        `
                SELECT
                    COUNT(*) AS products_low_stock
                FROM inventory i
                INNER JOIN products p
                    ON p.id = i.product_id
                WHERE i.company_id = ?
                AND i.quantity <= i.minimum_stock
                AND p.status = 'active'
                `,
        [company_id],
      ),

      db.execute(
        `
                SELECT
                    si.product_id,
                    p.name AS product_name,
                    SUM(si.quantity) AS quantity_sold,
                    SUM(si.total) AS total_sales
                FROM sale_items si
                INNER JOIN sales s
                    ON s.id = si.sale_id
                INNER JOIN products p
                    ON p.id = si.product_id
                WHERE s.company_id = ?
                AND s.status NOT IN ('cancelled')
                AND s.sale_date >= ?
                AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)
                GROUP BY
                    si.product_id,
                    p.name
                ORDER BY quantity_sold DESC
                LIMIT 10
                `,
        [company_id, start_date, end_date],
      ),
    ]);
    return {
      period: {
        start_date,
        end_date,
      },
      sales: sales[0],
      purchases: purchases[0],
      expenses: expenses[0],
      accounts_receivable: receivables[0],
      accounts_payable: payables[0],
      inventory: {
        products_low_stock: lowStock[0].products_low_stock,
      },
      top_products: topProducts,
    };
  }
}
