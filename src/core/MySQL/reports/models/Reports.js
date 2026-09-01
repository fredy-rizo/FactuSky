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
            COALESCE(SUM(original_amount), 0) AS total_amount,
            COALESCE(SUM(paid_amount), 0) AS paid_amount,
            COALESCE(SUM(pending_amount), 0) AS pending_amount
          FROM accounts_receivable
          WHERE company_id = ?
          AND status NOT IN ('paid', 'cancelled')
          AND issue_date >= ?
          AND issue_date < DATE_ADD(?, INTERVAL 1 DAY)
        `,
        [company_id, start_date, end_date],
      ),

      db.execute(
        `
          SELECT
            COUNT(*) AS total_accounts,
            COALESCE(SUM(original_amount), 0) AS total_amount,
            COALESCE(SUM(paid_amount), 0) AS paid_amount,
            COALESCE(SUM(pending_amount), 0) AS pending_amount
          FROM accounts_payable
          WHERE company_id = ?
          AND status NOT IN ('paid', 'cancelled')
          AND issue_date >= ?
          AND issue_date < DATE_ADD(?, INTERVAL 1 DAY)
        `,
        [company_id, start_date, end_date],
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
                AND p.active = 1
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

  // Resumen de ventas
  static async salesSummary(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
            COUNT(*) AS sales_count,
            COALESCE(SUM(subtotal), 0) AS subtotal,
            COALESCE(SUM(tax), 0) AS tax,
            COALESCE(SUM(discount), 0) AS discount,
            COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE company_id = ?
        AND status NOT IN ('cancelled')
        AND sale_date >= ?
        AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
        `,
      [company_id, start_date, end_date],
    );
    return rows[0];
  }

  // Ventas agrupadas por dia
  static async salesByDay(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT 
            DATE(sale_date) AS date,
            COUNT(*) AS sales_count,
            COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE company_id = ?
        AND status NOT IN ('cancelled')
        AND sale_date >= ?
        AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(sale_date)
        ORDER BY date ASC
        `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Productos mas vendidos
  static async salesSummary(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
            COUNT(*) AS sales_count,
            COALESCE(SUM(subtotal), 0) AS subtotal,
            COALESCE(SUM(tax), 0) AS tax,
            COALESCE(SUM(discount), 0) AS discount,
            COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE company_id = ?
        AND status NOT IN ('cancelled')
        AND sale_date >= ?
        AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
        `,
      [company_id, start_date, end_date],
    );
    return rows[0];
  }

  // Ventas agrupadas por dias
  static async salesByDay(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
            DATE(sales_date) AS date,
            COUNT(*) AS sales_count,
            COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE company_id = ?
        AND status NOT IN ('cancelled')
        AND sale_date >= ?
        AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(sale_date)
        ORDER BY date ASC
        `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Productos mas vendidos
  static async topSellingProducts(
    company_id,
    start_date,
    end_date,
    limit = 10,
  ) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const [rows] = await db.execute(
      `
        SELECT
            si.product_id,
            p.name AS product_name,
            SUM(si.quantity) AS quantity_sold,
            COALESCE(SUM(si.subtotal), 0) AS subtotal,
            COALESCE(SUM(si.total), 0) AS total
        FROM sale_items si
        INNER JOIN sales s
            ON p.id = si.product_id
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
        LIMIT ${safeLimit}
        `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Ventas por clientes
  static async salesByCustomer(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
            s.customer_id,
            COALESCE(
                c.name,
                'Cliente genereal'
            ) AS customer_name,
            COUNT(s.id) AS sales_count,
            COALESCE(SUM(s.total), 0) AS total
        FROM sales s
        LEFT JOIN customers c
            ON c.id = s.customer_id
        WHERE s.company_id = ?
        AND s.status NOT IN ('cancelled')
        AND s.sale_date >= ?
        AND s.sale_date < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY
            s.customer_id,
            c.name 
        ORDER BY total DESC
        `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Resumen de compras
  static async purchasesSummary(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
            COUNT(*) AS purchases_count,
            COALESCE(SUM(subtotal), 0) AS subtotal,
            COALESCE(SUM(tax), 0) AS tax,
            COALESCE(SUM(discount), 0) AS discount,
            COALESCE(SUM(total), 0) AS total
        FROM purchases
        WHERE company_id = ?
        AND status NOT IN ('cancelled')
        AND purchase_date >= ?
        AND purchase_date < DATE_ADD(?, INTERVAL 1 DAY)
        `,
      [company_id, start_date, end_date],
    );
    return rows[0];
  }

  // Compras por proveedor
  static async purchasesBySupplier(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
        SELECT
          p.id AS supplier_id,
          p.name AS supplier_name,
          COUNT(pu.id) AS purchases_count,
          COALESCE(SUM(pu.total), 0) AS total
        FROM purchases pu
        INNER JOIN suppliers p
          ON p.id = pu.supplier_id
        WHERE pu.company_id = ?
        AND pu.status NOT IN ('cancelled')
        AND pu.purchase_date >= ?
        AND pu.purchase_date < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY
          p.id,
          p.name
        ORDER BY total DESC
        `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Inventario actual
  static async inventory(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        id.id,
        i.product_id,
        p.name AS product_name,
        i.quantity,
        i.minimum_stock,
        CASE
          WHEN i.quantity <= i.minimum_stock
          THEN 1
          ELSE 0
        END AS low_stock
      FROM inventory i
      INNER JOIN products p
        ON p.id = i.product_id
      WHERE i.company_id = ?
      ORDER BY p.name ASC
      `,
      [company_id],
    );
    return rows;
  }

  // Productos con stock bajo
  static async lowStock(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        id.id,
        i.product_id,
        p.name AS product_name,
        i.quantity,
        i.minimum_stock
      FROM inventory i
      INNER JOIN products p
        ON p.id = i.product_id
      WHERE i.company_id = ?
      AND i.quantity <= i.minimum_stock
      AND p.active = 1
      ORDER BY
        i.quantity ASC,
        p.name ASC
      `,
      [company_id],
    );
    return rows;
  }

  // Movimientos de inventario
  static async inventoryMovements(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
      SELECT
        im.*,
        p.name AS product_name
      FROM inventory_movements im
      INNER JOIN products p
        ON p.id = im.product_id
      WHERE im.company_id = ?
      AND im.created_at >= ?
      AND im.created_at < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY
        im.created_at DESC,
        im.id DESC
      `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Resumen de caja
  static async cashSummary(company_id, start_date, end_date) {
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
        ) AS total_income

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

      COALESCE(
        SUM(
          CASE
            WHEN movement_type = 'income'
            THEN amount
            WHEN movement_type = 'expense'
            THEN -amount
            ELSE 0
          END
        ),
        0
      ) AS net_total
      FROM cash_movements
      WHERE company_id = ?
      AND movement_date >= ?
      AND movement_date < DATE_ADD(?, INTERVAL 1 DAY)
      `,
      [company_id, start_date, end_date],
    );
    return rows[0];
  }

  // Movimientos de caja
  static async cashMovements(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
      SELECT *
      FROM cash_movements
      WHERE company_id = ?
      AND movement_date >= ?
      AND movement_date < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY
        movement_date DESC,
        id DESC
      `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Resumen de gastos
  static async expensesSummary(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
      SELECT
        COUNT(*) AS expenses_count,
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(tax), 0) AS tax,
        COALESCE(SUM(discount), 0) AS discount,
        COALESCE(SUM(total), 0) AS total
      FROM expenses
      WHERE company_id = ?
      AND status != 'cancelled'
      AND expense_date >= ?
      AND expense_date < DATE_ADD(?, INTERVAL 1 DAY)
     `,
      [company_id, start_date, end_date],
    );
    return rows[0];
  }

  // Gastos por categoria
  static async expensesByCategory(company_id, start_date, end_date) {
    const [rows] = await db.execute(
      `
      SELECT
        ec.id AS category_id,
        ec.name AS category_name,
        COUNT(e.id) AS expenses_count,
        COALESCE(SUM(e.total), 0) AS total
      FROM expenses e
      INNER JOIN expense_categories ec
        ON ec.id = e.category_id
      WHERE e.company_id = ?
      AND e.status != 'cancelled'
      AND e.expense_date >= ?
      AND e.expense_date < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY
        ec.id,
        ec.name
      ORDER BY total DESC
      `,
      [company_id, start_date, end_date],
    );
    return rows;
  }

  // Cuentas por cobrar
  static async receivables(company_id) {
    const [rows] = await db.execute(
      `
      SELECT
        COUNT(*) AS accounts_count,
        COALESCE(
          SUM(total_amount),
          0
        ) AS total_amount,
        COALESCE(
          SUM(paid_amount),
          0
        ) AS paid_amount,
        COALESCE(
          SUM(
            total_amount - paid_amount
          ),
          0
        ) AS pending_amount
      FROM accounts_receivable
      WHERE company_id = ?
      AND status != 'cancelled'
      `,
      [company_id],
    );
    return rows[0];
  }

  // Cuentas por pagar
  static async payables(company_id) {
    const [rows] = await db.execute(
      `
      SELECT 
        COUNT(*) AS accounts_count,
        COALESCE(
          SUM(total_amount),
          0
        ) AS total_number,
        COALESCE(
          SUM(paid_amount),
          0
        ) AS paid_amount,
        COALESCE(
          SUM(
            total_amount - paid_amount
          ),
          0
        ) AS pending_amount
      FROM accounts_payable
      WHERE company_id = ?
      AND status != 'cancelled'
      `,
      [company_id],
    );
    return rows[0];
  }
}
