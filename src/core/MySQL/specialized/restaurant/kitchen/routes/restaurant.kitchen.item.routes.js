import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  cancel_restaurant_kitchen_item,
  list_restaurant_kitchen_by_table,
  list_restaurant_kitchen_item,
  list_restaurant_kitchen_order,
  lists_restaurant_kitchen_items,
  ready_restaurant_kitchen_item,
  reopen_restaurant_kitchen_item,
  serve_restaurant_kitchen_item,
  start_restaurant_kitchen_item,
  update_restaurant_kitchen_notes,
} from "../controllers/restaurant.kitchen.item.controllers.js";
const router = Router();

router.post(
  "/list/:company_id/:pag/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.view"),
  Paginate,
  lists_restaurant_kitchen_items,
); // Cola de cocina

router.get(
  "/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.view"),
  list_restaurant_kitchen_item,
); // Listar item especifico

router.get(
  "/:company_id/order/:order_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.view"),
  list_restaurant_kitchen_order,
); // Comanda de una orden

router.get(
  "/:company_id/table/:table_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.view"),
  list_restaurant_kitchen_by_table,
); // Cocina por mesa

router.patch(
  "/:company_id/start/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.start"),
  start_restaurant_kitchen_item,
); // Iniciar preparacion

router.patch(
  "/:company_id/ready/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.ready"),
  ready_restaurant_kitchen_item,
); // Marcar como listo

router.patch(
  "/:company_id/serve/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.serve"),
  serve_restaurant_kitchen_item,
); // Marcar como servido

router.patch(
  "/:company_id/cancel/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.cancel"),
  cancel_restaurant_kitchen_item,
); // Cancelar en cocina

router.patch(
  "/:company_id/reopen/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.reopen"),
  reopen_restaurant_kitchen_item,
); // Reabrir producto cancelado

router.patch(
  "/:company_id/notes/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.kitchen.notes"),
  update_restaurant_kitchen_notes,
); // Actualizar notas

export default router;
