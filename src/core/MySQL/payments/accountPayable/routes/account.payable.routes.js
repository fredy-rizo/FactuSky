import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  accounts_payable_by_supplier,
  accounts_payable_summary,
  cancel_account_payable,
  create_account_payable,
  list_account_payable,
  lists_accounts_payable,
} from "../controllers/account.payable.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_payabla", "create"),
  create_account_payable,
); // Crear cuenta por pagar

router.get(
  "/list/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  Paginate,
  lists_accounts_payable,
); // Mostrar cuentas por cargar

router.get(
  "/list-alone/:company_id/:id",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  list_account_payable,
); // Listar una sola cuenta por pagar

router.get(
  "/list/:company_id/supplier/:supplier_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  Paginate,
  accounts_payable_by_supplier,
); // Cargando cuenta del proveedor

router.put(
  "/:company_id/:id/cancel",
  TokenAny,
  TokenPermissions("accounts_payable", "update"),
  cancel_account_payable,
); // Cancelar cuentas por pagar

router.get(
  "/sumary/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  Paginate,
  accounts_payable_summary,
); // Generar resumen de cuentas

export default router;
