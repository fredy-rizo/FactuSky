import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  approve_expense,
  cancel_expense,
  create_expense,
  expenses_summary,
  list_expense,
  lists_expenses,
  pay_expense,
  pending_expenses,
  update_expense,
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

router.put(
  "/:company_id/update/:id",
  TokenAny,
  TokenPermissions("expenses", "update"),
  update_expense,
); // Actualizar gasto

router.patch(
  "/:company_id/approve/:id",
  TokenAny,
  TokenPermissions("expenses", "update"),
  approve_expense,
); // Aprobar gasto

router.patch(
  "/:company_id/cancel/:id",
  TokenAny,
  TokenPermissions("expenses", "update"),
  cancel_expense,
); // Cancelar gasto

router.get(
  "/pending/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("expenses", "view"),
  Paginate,
  pending_expenses,
); // Listar gastos pendientes

router.get(
  "/:company_id/summary/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("expenses", "view"),
  Paginate,
  expenses_summary,
); // Resumen de

router.post(
  "/:company_id/pay/:id",
  TokenAny,
  TokenPermissions("expenses", "pay"),
  pay_expense,
); // Pagar gasto

export default router;
