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
import Payment from "./core/MySQL/payment/routes/payment.routes.js";
import Product from "./core/MySQL/products/routes/products.routes.js";
import Customer from "./core/MySQL/terceros/customers/routes/customer.routes.js";

const app = express();
console.log(config);

app.set("port", config.PORT);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log("Time:", new Date());
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

export default app;
