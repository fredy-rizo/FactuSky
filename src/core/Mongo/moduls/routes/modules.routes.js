import { Router } from "express";
import {
  create_module,
  list_modules,
  list_modules_active,
  list_modules_inactive,
  update_module,
} from "../controllers/modules.controllers.js";
import {
  TokenAny,
  TokenAuthorize,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
const router = Router();

router.post("/create", TokenAny, TokenAuthorize("super admin"), create_module); // Crear modulo

router.put(
  "/update/:module_id",
  TokenAny,
  TokenAuthorize("super admin"),
  update_module,
); // Actualizar modulo

router.get(
  "/list-modules/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_modules,
); // Listar modulos

router.get(
  "/list-modules-inactives/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_modules_inactive,
); // Listar modulos inactivos

router.get(
  "/list-modules-actives/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_modules_active,
); // Listar modulos activos

export default router;
