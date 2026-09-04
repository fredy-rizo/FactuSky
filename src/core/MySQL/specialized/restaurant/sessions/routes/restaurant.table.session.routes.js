import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  list_restaurant_table_session,
  open_restaurant_table_session,
} from "../controllers/restaurant.table.session.controllers.js";
const router = Router();

router.post(
  "/open",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.open"),
  open_restaurant_table_session,
); // Abrir sesion

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.view"),
  list_restaurant_table_session,
); // Obtener sesion

export default router;
