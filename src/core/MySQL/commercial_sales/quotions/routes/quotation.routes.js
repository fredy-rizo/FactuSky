import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import { create_quotation } from "../controllers/quotation.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("quotations", "create"),
  create_quotation,
); // Crear cotizacion

export default router;
