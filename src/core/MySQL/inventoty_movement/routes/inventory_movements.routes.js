import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_inventory_movements,
  list_inventory_movememt,
  lists_inventorys_movememts,
} from "../controllers/inventory_movements.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products.create"),
  create_inventory_movements,
); // Crear movimiento de inventario

router.get(
  "/lists-inventorys-movememts/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products.view"),
  Paginate,
  lists_inventorys_movememts,
); // Listar movimientos de inventario

router.get(
  "/list-inventory-movememt/:company_id/:id",
  TokenAny,
  TokenPermissions("products.view"),
  list_inventory_movememt,
); // Listar un solo movimiento

export default router;
