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

router.post("/create", TokenAny, create_role); // Crear rol de empresa — super admin y company_user (control en controller)

router.get(
  "/list-role/:company_id/:pag?/:perpage?",
  TokenAny,
  Paginate,
  list_role_company,
); // Listar roles de empresa — permite super admin y company_user (control en controller)

router.get(
  "/list/:role_id",
  TokenAny,
  list_role_unique,
); // Listar un solo rol

router.put(
  "/update/:role_id",
  TokenAny,
  update_role_company,
); // Actualizar rol de empresa

router.put(
  "/change-status/:role_id",
  TokenAny,
  change_role_status,
); // Activar o desactivar rol — ahora accesible para empresa

export default router;
