import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_inventory,
  list_inventory,
  lists_inventorys,
  remove_inventory,
  update_inventory,
} from "../controllers/inventory.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("inventory", "create"),
  create_inventory,
); // Crear inventario

router.get(
  "/lists-inventorys/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("inventory", "view"),
  Paginate,
  lists_inventorys,
); // Listar inventario

router.get(
  "/list-inventory/:company_id/:id",
  TokenAny,
  TokenPermissions("inventory", "view"),
  list_inventory,
); // Lsitar un solo inventario

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("inventory", "update"),
  update_inventory,
); // Actualizar inventario

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("inventory", "delete"),
  remove_inventory,
); // Eliminar inventario

export default router;
