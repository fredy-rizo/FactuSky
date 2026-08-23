import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_customer_payment,
  customer_payments_by_account,
  customer_payments_by_customer,
} from "../controllers/customer.payment.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_receivable", "create"),
  create_customer_payment,
); // Registar pago de cliente

router.get(
  "/:company_id/account/:account_receivable_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  Paginate,
  customer_payments_by_account,
); // Ver pagos de cuenta por cobrar

router.get(
  "/:company_id/customer/:customer_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("accounts_receivable", "view"),
  Paginate,
  customer_payments_by_customer,
); // Ver pagos de un cliente

export default router;
