import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { create_restaurant_sale } from "../controllers/restaurant.integration.controllers.js";
const router = Router();

router.post(
  "/:company_id/:order_id/checkout",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.checkout"),
  create_restaurant_sale,
);

export default router;
