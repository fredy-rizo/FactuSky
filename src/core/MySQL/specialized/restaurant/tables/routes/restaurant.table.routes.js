import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  create_restaurant_table,
  list_restaurant_table,
  lists_restaurant_tables,
} from "../controllers/restaurant.tablet.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.manage"),
  create_restaurant_table,
); // Crear mesa

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.view"),
  Paginate,
  lists_restaurant_tables,
); // Listar mesas

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.view"),
  list_restaurant_table,
); // Obtener mesa

export default router;
