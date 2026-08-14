import { Router } from "express";
import {
  TokenAny,
  TokenAuthorize,
} from "../../../../middleware/tools/segurity.js";
import {
  change_role_status,
  create_role,
  list_role_company,
  list_role_unique,
  update_role_company,
} from "../controllers/role.controllers.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
const router = Router();

router.post("/create", TokenAny, TokenAuthorize("super admin"), create_role); // Crear rol de empresa

router.get(
  "/list-role/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_role_company,
); // Listar roles de empresa

router.get(
  "/list/:role_id",
  TokenAny,
  TokenAuthorize("super admin"),
  list_role_unique,
); // Listar un solo rol

router.put(
  "/update/:role_id",
  TokenAny,
  TokenAuthorize("super admin"),
  update_role_company,
); // Actualizar rol de empresa

router.put(
  "/change-status/:role_id",
  TokenAny,
  TokenAuthorize("super admin"),
  change_role_status,
); // Activar o desactivar rol

export default router;
