import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  cash_summary,
  create_cash_movement,
  lists_cash_movements,
} from "../controllers/cash.movement.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("cash", "add_money"),
  create_cash_movement,
); // Crear movimiento de caja

router.get(
  "/lists/:company_id/:cash_opening_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("cash", "view"),
  Paginate,
  lists_cash_movements,
); // Listar movimientos

router.get(
  "/lists-sumary/:company_id/:cash_opening_id",
  TokenAny,
  TokenPermissions("cash", "view"),
  cash_summary,
); // Resumen de caja

export default router;
