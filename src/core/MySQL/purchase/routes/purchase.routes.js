import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  cancel_purchase,
  confirm_purchase,
  create_purchase,
  list_purchase,
  lists_purchases,
  update_purchase,
} from "../controllers/purchase.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("purchases", "create"),
  create_purchase,
); // Crear venta

router.get(
  "/lists-purchases/:company_id",
  TokenAny,
  TokenPermissions("purchases", "view"),
  Paginate,
  lists_purchases,
); // Listar compras

router.get(
  "/list-purchase/:company_id/:id",
  TokenAny,
  TokenPermissions("purchases", "view"),
  list_purchase,
); // Listar una sola compra

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("purchases", "update"),
  update_purchase,
); // Actualizar compra

router.patch(
  "/cancel/:company_id/:id",
  TokenAny,
  TokenPermissions("purchases", "update"),
  cancel_purchase,
); // Compra cancelada

router.patch(
  "/confirm/:company_id/:id",
  TokenAny,
  TokenPermissions("purchases", "update"),
  confirm_purchase,
); // Confirmar compra

export default router;
