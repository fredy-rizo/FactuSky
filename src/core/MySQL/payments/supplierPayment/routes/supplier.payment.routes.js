import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_supplier_payment,
  supplier_payments_by_account,
  supplier_payments_by_supplier,
} from "../controllers/supplier.payment.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_payable", "create"),
  create_supplier_payment,
); // Registrar pago a proveedor

router.get(
  "/:company_id/account/:account_payable_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  Paginate,
  supplier_payments_by_account,
); // Ver pagos de una cuenta por pagar

router.get(
  "/:company_id/supplier/:supplier_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_payable", "view"),
  Paginate,
  supplier_payments_by_supplier,
); // Cargando historial de pagos

export default router;
