import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_supplier,
  list_supplier,
  list_suppliers,
  remove_supplier,
  update_supplier,
} from "../controllers/supplier.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("suppliers", "views"),
  create_supplier,
); // Crear proveedor

router.get(
  "/list-suppliers/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("suppliers", "view"),
  Paginate,
  list_suppliers,
); // Listar proveedores

router.get(
  "/list-supplier/:company_id/:id",
  TokenAny,
  TokenPermissions("suppliers", "view"),
  list_supplier,
); // Listar un solo proveedor

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("suppliers", "update"),
  update_supplier,
); // Actualizar proveedor

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("suppliers", "delete"),
  remove_supplier,
); // Eliminar proveedor

export default router;
