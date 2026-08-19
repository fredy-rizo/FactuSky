import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_cash_register,
  list_cash_register,
  lists_cash_registers,
  update_cash_register,
} from "../controllers/cash.registers.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("cash", "open"),
  create_cash_register,
); // Crear caja

router.get(
  "/lists-cash/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("cash", "view"),
  Paginate,
  lists_cash_registers,
); // Listar cajas

router.get(
  "/list-cash/:company_id/:id",
  TokenAny,
  TokenPermissions("cash", "view"),
  list_cash_register,
); // Listar una sola caja

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("cash", "update"),
  update_cash_register,
); // Actualizar caja

export default router;
