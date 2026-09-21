import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import { create_restaurant_qr } from "../controllers/restaurant.qr.code.controllers.js";
const router = Router();

router.post(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.create"),
  create_restaurant_qr,
); // Crear QR

export default router;
