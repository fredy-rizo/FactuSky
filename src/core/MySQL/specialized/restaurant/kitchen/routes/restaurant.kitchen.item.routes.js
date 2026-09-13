import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import { lists_restaurant_kitchen_items } from "../models/restaurant.kitchen.item.controllers.js";
const router = Router();

router.post(
  "/list/:company_id/:pag/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.view"),
  Paginate,
  lists_restaurant_kitchen_items,
); // Cola de cocina

export default router;
