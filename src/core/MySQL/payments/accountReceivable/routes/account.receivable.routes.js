import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  accounts_receivable_by_customer,
  accounts_receivable_summary,
  cancel_account_receivable,
  create_account_receivable,
  list_account_receivable,
  lists_accounts_receivable,
} from "../controllers/account.receivable.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_receivable", "create"),
  create_account_receivable,
); // Crear cuenta por cobrar

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  Paginate,
  lists_accounts_receivable,
); // Listar cuentas por cobrar

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  list_account_receivable,
); // Listar una sola cuenta por cobrar

router.get(
  "/list/:company_id/customer/:customer_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  Paginate,
  accounts_receivable_by_customer,
); // Listar cuentas por cobrar de un cliente

router.put(
  "/cancel/:company_id/:id",
  TokenAny,
  TokenPermissions("accounts_receivable", "update"),
  cancel_account_receivable,
); // Cancelar cuenta por cobrar

router.get(
  "/sumary/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  Paginate,
  accounts_receivable_summary,
); // Resumen de cuentas por cobrar

export default router;
