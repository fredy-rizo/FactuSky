import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  add_restaurant_order_item,
  create_restaurant_order,
  list_restaurant_order,
  list_restaurant_orders_by_session,
  list_restaurant_orders_by_table,
  lists_restaurant_orders,
  remove_restaurant_order_item,
  update_restaurant_order_item,
} from "../controllers/restaurant.order.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.create"),
  create_restaurant_order,
); // Crear order

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.view"),
  list_restaurant_order,
); // Listar ordenes

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.view"),
  Paginate,
  lists_restaurant_orders,
); // Listar ordenes

router.get(
  "/:company_id/table/:table_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.view"),
  list_restaurant_orders_by_table,
); // Ordenes de mesa

router.get(
  "/:company_id/session/:session_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.view"),
  list_restaurant_orders_by_session,
); // Ordenes de la sesion

router.post(
  "/:company_id/items/:order_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.update"),
  add_restaurant_order_item,
); // Agregar producto

router.put(
  "/update/:company_id/item/:order_id/:item_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.update"),
  update_restaurant_order_item,
); // Actualizar producto

router.delete(
  "/remove/:company_id/item/:order_id/:item_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.orders.delete"),
  remove_restaurant_order_item,
); // Eliminar producto

export default router;
