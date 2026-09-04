import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  get_active_restaurant_table_session,
  list_restaurant_table_session,
  lists_restaurant_table_sessions,
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

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.view"),
  Paginate,
  lists_restaurant_table_sessions,
); // Listar sesiones

router.get(
  "/:company_id/table/:table_id/active",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.view"),
  get_active_restaurant_table_session,
); // Listar sesion activa de una mesa

export default router;
