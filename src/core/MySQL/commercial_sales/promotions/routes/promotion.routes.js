import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import { create_promotion } from "../controllers/promotion.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("promotions", "create"),
  create_promotion,
); // Crear promocion

export default router;
