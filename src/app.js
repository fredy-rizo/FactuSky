import express from "express";
import morgan from "morgan";
import cors from "cors";
import config from "./config.js";

//* Mongo
import User from "./core/Mongo/users/routes/user.routes.js";
import Module from "./core/Mongo/moduls/routes/modules.routes.js";
import Plan from "./core/Mongo/plans/routes/plan.routes.js";
import Company from "./core/Mongo/companies/routes/company.routes.js";
import Role from "./core/Mongo/role/routes/role.routes.js";
import CompanyUser from "./core/Mongo/companyUser/routes/companyUser.routes.js";

//? MySQL
import Category from "./core/MySQL/category/routes/category.routes.js";
import Unit from "./core/MySQL/unit/routes/unit.routes.js";
import Payment from "./core/MySQL/payment_methods/routes/payment.routes.js";
import Product from "./core/MySQL/products/routes/products.routes.js";
import Customer from "./core/MySQL/terceros/customers/routes/customer.routes.js";
import Supplier from "./core/MySQL/terceros/suppliers/routes/supplier.routes.js";
import Warehouses from "./core/MySQL/warehouses/routes/warehouses.routes.js";
import Inventory from "./core/MySQL/inventory/routes/inventory.routes.js";
import InventoryMovement from "./core/MySQL/inventoty_movement/routes/inventory_movements.routes.js";
import Purchase from "./core/MySQL/purchase/routes/purchase.routes.js";
import Sale from "./core/MySQL/sale/routes/sale.routes.js";
import CashRegister from "./core/MySQL/caja/cashRegister/routes/cash.registers.routes.js";
import CashOpening from "./core/MySQL/caja/cashOpening/routes/cash.opening.routes.js";
import CashMovement from "./core/MySQL/caja/cashMovement/routes/cash.movement.routes.js";
import CashClosure from "./core/MySQL/caja/cashClosure/routes/cash.closure.routes.js";
import AccountReceivable from "./core/MySQL/payments/accountReceivable/routes/account.receivable.routes.js";
import CustomerPayment from "./core/MySQL/payments/customerPayment/routes/customer.routes.js";
import AccountPayable from "./core/MySQL/payments/accountPayable/routes/account.payable.routes.js";
import SupplierPayment from "./core/MySQL/payments/supplierPayment/routes/supplier.payment.routes.js";
import Quotation from "./core/MySQL/commercial_sales/quotions/routes/quotation.routes.js";
import Order from "./core/MySQL/commercial_sales/orders/routes/order.routes.js";
import Promotion from "./core/MySQL/commercial_sales/promotions/routes/promotion.routes.js";
import ExpenseCategory from "./core/MySQL/bills/expenseCategory/routes/expense.category.routes.js";
import Expense from "./core/MySQL/bills/expense/routes/expense.routes.js";
import Report from "./core/MySQL/reports/routes/reports.routes.js";

const app = express();


app.set("port", config.PORT);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  
  next();
});

//* Mongo
app.use("/api/user", User);
app.use("/api/module", Module);
app.use("/api/plan", Plan);
app.use("/api/company", Company);
app.use("/api/role", Role);
app.use("/api/company-user", CompanyUser);

//? MySQL
app.use("/api/category", Category);
app.use("/api/unit", Unit);
app.use("/api/payment", Payment);
app.use("/api/product", Product);
app.use("/api/third-parties/customer", Customer);
app.use("/api/third-parties/supplier", Supplier);
app.use("/api/warehouses", Warehouses);
app.use("/api/inventory", Inventory);
app.use("/api/inventory-movememt", InventoryMovement);
app.use("/api/purchase", Purchase);
app.use("/api/sale", Sale);
app.use("/api/cash-registers", CashRegister);
app.use("/api/cash-opening", CashOpening);
app.use("/api/cash-movement", CashMovement);
app.use("/api/cash-closure", CashClosure);
app.use("/api/account-receivable", AccountReceivable);
app.use("/api/customer-payment", CustomerPayment);
app.use("/api/account-payable", AccountPayable);
app.use("/api/supplier-payment", SupplierPayment);
app.use("/api/quotation", Quotation);
app.use("/api/order", Order);
app.use("/api/promotion", Promotion);
app.use("/api/expense-category", ExpenseCategory);
app.use("/api/expense", Expense);
app.use("/api/report", Report);

export default app;
