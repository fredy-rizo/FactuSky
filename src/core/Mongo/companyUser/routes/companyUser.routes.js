import { Router } from "express";
import {
  TokenAny,
  TokenAuthorize,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  change_password_user_company,
  change_status_user_company,
  create,
  list_user_company,
  list_users_actives_companies,
  list_users_company,
  list_users_inactives_companies,
  login,
  update_user_company,
} from "../controllers/companyUser.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("company_user:create"),
  create,
); // Crear usuario para empresa

router.post("/login", login); // Iniciar sesion usuario de empresa

router.get(
  "/list/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("company_users.view"),
  Paginate,
  list_users_company,
); // Listar usuarios de empresa

router.get(
  "/list/-/:user_id/-/company",
  TokenAny,
  TokenPermissions("company_users.view"),
  list_user_company,
); // Listar un solo usuario de empresa

router.get(
  "/list-inactives-users/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("company_users.view"),
  Paginate,
  list_users_inactives_companies,
); // Listar usuarios inactivos de empresa

router.get(
  "/list-actives-users/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("company_users.view"),
  Paginate,
  list_users_actives_companies,
); // Listar usuarios activos de empresa

router.put(
  "/update/:user_id/company",
  TokenAny,
  TokenPermissions("company_users.update"),
  update_user_company,
); // Actualizar usuario de empresa

router.put(
  "/change-password/:user_id",
  TokenAny,
  TokenPermissions("company_users.update"),
  change_password_user_company,
); // Actualizar contraseña

router.put(
  "/change-status/:user_id",
  TokenAny,
  TokenPermissions("company_users.update"),
  change_status_user_company,
); // Activar o desactivar usuario

export default router;
