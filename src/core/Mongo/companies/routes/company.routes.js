import { Router } from "express";
import {
  TokenAny,
  TokenAuthorize,
} from "../../../../middleware/tools/segurity.js";
import {
  add_module_company,
  change_company_status,
  change_module_company_status,
  create_company,
  list_company,
  list_company_actives,
  list_company_inactives,
  list_companys,
  update_company,
} from "../controllers/company.controllers.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
const router = Router();

router.post("/create", TokenAny, TokenAuthorize("super admin"), create_company); // Crear empresa

router.get(
  "/list-companys/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_companys,
); // Listar empresas

router.get(
  "/list/:company_id",
  TokenAny,
  TokenAuthorize("super admin"),
  list_company,
); // Listar empresa por ID

router.get(
  "/list-inactives/:pag?/:perpage",
  TokenAny,
  TokenAuthorize("super admin"),
  list_company_inactives,
); // Listar empresas inactivas

router.get(
  "/list-actives/:pag?/:perpage",
  TokenAny,
  TokenAuthorize("super admin"),
  list_company_actives,
); // Listar empresas inactivas

router.put(
  "/update/:company_id",
  TokenAny,
  TokenAuthorize("super admin"),
  update_company,
); // Actualizar empresa

router.put(
  "/change-status/:company_id",
  TokenAny,
  TokenAuthorize("super admin"),
  change_company_status,
); // Activar o desactivar empresa

router.put(
  "/change-modules/:company_id/:module_id",
  TokenAny,
  TokenAuthorize("super admin"),
  change_module_company_status,
); // Activar o desactivar modulos de empresa

router.post(
  "/add-modules/:company_id/:module_id",
  TokenAny,
  TokenAuthorize("super admin"),
  add_module_company,
); // Agregar modulo a empresa

export default router;
