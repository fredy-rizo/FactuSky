import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import { create_account_payable } from "../controllers/account.payable.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("accounts_payabla", "create"),
  create_account_payable,
); // Crear cuenta por pagar

export default router;
