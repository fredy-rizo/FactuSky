import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  confirm_order,
  create_order,
  deliver_order,
  process_order,
  ready_order,
} from "../controllers/order.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("orders", "view"),
  create_order,
); // Crear pedido

router.patch(
  "/:company_id/confirmed/:id",
  TokenAny,
  TokenPermissions("orders", "update_status"),
  confirm_order,
); // Confirmar pedido

router.patch(
  "/:company_id/process/:id",
  TokenAny,
  TokenPermissions("orders", "update_status"),
  process_order,
); // Procesar pedido

router.patch(
  "/:company_id/ready/:id",
  TokenAny,
  TokenPermissions("orders", "update_status"),
  ready_order,
); // Pedido listo

router.patch(
  "/:company_id/deliver/:id",
  TokenAny,
  TokenPermissions("orders", "update_status"),
  deliver_order,
); // Entregar pedido

export default router;
