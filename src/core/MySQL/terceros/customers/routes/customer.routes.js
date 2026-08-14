import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_customers,
  list_customer,
  list_customers,
  remove_customer,
  update_customer,
} from "../controllers/customer.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products.create"),
  create_customers,
); // Crear clientes

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products.view"),
  Paginate,
  list_customers,
); // Listar clientes

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("products.view"),
  list_customer,
); // Listar un solo cliente

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("products.update"),
  update_customer,
); // Actualizar cliente

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("products.delete"),
  remove_customer,
); // Eliminar cliente

export default router;
