import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  close_cash,
  list_cash_closure,
  lists_cash_closures,
} from "../controllers/cash.closure.controllers.js";
const router = Router();

router.post("/close", TokenAny, TokenPermissions("cash", "close"), close_cash); // Cerrar caja

router.get(
  "/lists/:company_id/:pag/:perpage?",
  TokenAny,
  TokenPermissions("cash", "view"),
  Paginate,
  lists_cash_closures,
); // Listar cierres

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("cash", "view"),
  list_cash_closure,
); // Listar un solo cierre de caja

export default router;
