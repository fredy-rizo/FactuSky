import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import {
  create_promotion,
  promotions_by_product,
} from "../controllers/promotion.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("promotions", "create"),
  create_promotion,
); // Crear promocion

router.get(
  "/:company_id/:product_id",
  TokenAny,
  TokenPermissions("promotions", "view"),
  promotions_by_product,
); // Consultar promociones de un producto

export default router;
