import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_warehouses,
  list_warehouse,
  lists_warehouses,
  remove_warehouse,
  update_warehouse,
} from "../controllers/warehouses.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products", "create"),
  create_warehouses,
); // Crear bodega

router.get(
  "/lists-warehouses/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products", "view"),
  Paginate,
  lists_warehouses,
); // Listar bodegas

router.get(
  "/list-warehouse/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "view"),
  list_warehouse,
); // Listar una sola bodega

router.put(
  "/update-warehouse/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "update"),
  update_warehouse,
); // Actualizar bodega

router.delete(
  "/remove-warehouse/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "delete"),
  remove_warehouse,
); // Eliminar bodega

export default router;
