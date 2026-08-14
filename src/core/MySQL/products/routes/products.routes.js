import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_product,
  list_product,
  list_products,
  remove_product,
  update_product,
} from "../controllers/products.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products.create"),
  create_product,
); // Crear productos

router.get(
  "/list/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products.view"),
  Paginate,
  list_products,
); // Listar productos

router.get(
  "/list-product/:company_id/:id",
  TokenAny,
  TokenPermissions("products.view"),
  list_product,
); // Listar un solo producto

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("products.update"),
  update_product,
); // Actualizar producto

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("products.delete"),
  remove_product,
); // Eliminar producto

export default router;
