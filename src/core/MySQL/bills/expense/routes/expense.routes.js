import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_expense,
  list_expense,
  lists_expenses,
} from "../controllers/expense.controller.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("expenses", "create"),
  create_expense,
); // Crear gasto

router.get(
  "/lists/:company_id/expenses/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("expenses", "view"),
  Paginate,
  lists_expenses,
); // Listar gastos

router.get(
  "/list/:company_id/expense/:id",
  TokenAny,
  TokenPermissions("expenses", "view"),
  list_expense,
); // Listar un solo gasto

export default router;
