import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  cancel_restaurant_table_session,
  close_restaurant_table_session,
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

router.patch(
  "/:company_id/close/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.close"),
  close_restaurant_table_session,
); // cerrar sesion

router.patch(
  "/:company_id/cancel/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.sessions.cancel"),
  cancel_restaurant_table_session,
); // Cancelar sesion

export default router;
