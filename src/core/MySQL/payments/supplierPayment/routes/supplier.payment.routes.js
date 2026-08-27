import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import { create_supplier_payment } from "../controllers/supplier.payment.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_payable", "create"),
  create_supplier_payment,
); // Registrar pago a proveedor

export default router;
