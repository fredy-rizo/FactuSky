import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  current_cash,
  lists_cash_openings,
  open_cash,
} from "../controllers/cash.opening.controllers.js";
const router = Router();

router.post("/open", TokenAny, TokenPermissions("cash", "open"), open_cash); // Abrir caja

router.get(
  "/current/:company_id/:cash_register_id",
  TokenAny,
  TokenPermissions("cash", "view"),
  current_cash,
); // Mostrar apertura de caja

router.get(
  "/lists-cash/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("cash", "view"),
  Paginate,
  lists_cash_openings,
); // Mostrar todas las aperturas de caja(historial)

export default router;
