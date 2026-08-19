import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_category,
  list_category,
  list_categorys,
  remove_category,
  update_category,
} from "../controllers/category.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products", "create"),
  create_category,
); // Crear categoria

router.get(
  "/lists-categorys/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products", "view"),
  Paginate,
  list_categorys,
); // Listar categorias de empresa

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "view"),
  list_category,
); // Listar una sola categoria

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "update"),
  update_category,
); // Actualizar categoria

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("products", "delete"),
  remove_category,
); // Eliminar categoria

export default router;
