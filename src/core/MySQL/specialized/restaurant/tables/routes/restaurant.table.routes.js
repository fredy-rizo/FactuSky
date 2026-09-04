import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  change_restaurant_table_status,
  check_restaurant_table_availability,
  create_restaurant_table,
  deactivate_restaurant_table,
  list_restaurant_table,
  lists_restaurant_tables,
  restaurant_tables_statistics,
  update_restaurant_table,
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

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.manage"),
  update_restaurant_table,
); // Actualizar mesas

router.patch(
  "/change/:company_id/:id/status",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.manage"),
  change_restaurant_table_status,
); // Cambiar estado de mesa (status - available, reserved, inactive)

router.delete(
  "/deactive/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.manage"),
  deactivate_restaurant_table,
); // Desactivar mesa

router.get(
  "/availability/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.view"),
  check_restaurant_table_availability,
); // Mesas disponibles

router.get(
  "/statistics/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.tables.view"),
  restaurant_tables_statistics,
); // Estadisticas de mesass

export default router;
