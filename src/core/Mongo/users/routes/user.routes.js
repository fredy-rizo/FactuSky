import { Router } from "express";
import {
  create,
  list_users,
  login,
  update_data,
} from "../controllers/user.controllers.js";
import {
  TokenAny,
  TokenAuthorize,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import { BootstrapCreateUser } from "../../../../middleware/tools/bootstrap.js";
const router = Router();

router.post("/create", BootstrapCreateUser, create); // Crear usuario de FactuSky

router.post("/login", login); // Login usuario de FactuSky

router.put(
  "/update/:user_id",
  TokenAny,
  TokenAuthorize("super admin"),
  update_data,
); // Actualizar role y active en usuario de FactuSky

router.get(
  "/list/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_users,
); // Listar usuarios

export default router;
