import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_unit,
  list_unit,
  list_units,
  remove_unit,
  update_unit,
} from "../controllers/unit.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products.create"),
  create_unit,
); // Crear unidades

router.get(
  "/list/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("products.view"),
  Paginate,
  list_units,
); // Listar todas las unidades

router.get(
  "/list-unit/:company_id/:id",
  TokenAny,
  TokenPermissions("products.view"),
  list_unit,
); // Listar unidades por ID

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("products.update"),
  update_unit,
); // Actualizar unidad

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("products.delete"),
  remove_unit,
); // Eliminar unidad

export default router;
