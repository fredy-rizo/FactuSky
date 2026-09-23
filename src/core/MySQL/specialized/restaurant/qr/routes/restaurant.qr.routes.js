import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  activate_restaurant_qr,
  create_restaurant_qr,
  deactivate_restaurant_qr,
  list_restaurant_qr,
  list_restaurant_qrs_by_table,
  lists_restaurant_qrs,
  regenerate_restaurant_qr,
  validate_restaurant_qr,
} from "../controllers/restaurant.qr.code.controllers.js";
const router = Router();

router.get("/public/:token", validate_restaurant_qr); // QR publico

router.post(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.create"),
  create_restaurant_qr,
); // Crear QR

router.get(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.view"),
  Paginate,
  lists_restaurant_qrs,
); // Listar todos los QR

router.get(
  "/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.view"),
  list_restaurant_qr,
); // Listar un solo QR

router.get(
  "/:company_id/:table_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.view"),
  list_restaurant_qrs_by_table,
); // Listar QR de mesa

router.patch(
  "/deactivate/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.deactivate"),
  deactivate_restaurant_qr,
); // Desactivar QR

router.patch(
  "/activate/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.activate"),
  activate_restaurant_qr,
); // Activar QR

router.post(
  "/regenerate/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant_qr.regenerate"),
  regenerate_restaurant_qr,
); // Regenerar QR

export default router;
