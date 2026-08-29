import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_expense_category,
  list_expense_category,
  lists_expense_categories,
  toggle_expense_category,
  update_expense_category,
} from "../controllers/expense.category.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("expenses", "create"),
  create_expense_category,
); // Crear categoria de gasto

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("expenses", "view"),
  Paginate,
  lists_expense_categories,
); // Listar todas las categorias de gastos

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("expenses", "view"),
  list_expense_category,
); // Ver una categoria de gasto

router.put(
  "/:company_id/update/:id",
  TokenAny,
  TokenPermissions("expenses", "update"),
  update_expense_category,
); // Actualizar categoria de gasto

router.patch(
  "/:company_id/toggle/:id",
  TokenAny,
  TokenPermissions("expenses", "update"),
  toggle_expense_category,
); // Activar/desactivar categoria

export default router;
