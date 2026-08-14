import { Router } from "express";
import {
  TokenAny,
  TokenAuthorize,
} from "../../../../middleware/tools/segurity.js";
import {
  create_plan,
  list_plans,
  list_plans_active,
  list_plans_inactive,
  update_plan,
} from "../controllers/plan.controllers.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
const router = Router();

router.post("/create", TokenAny, TokenAuthorize("super admin"), create_plan); // Crear plan

router.put(
  "/update/:plan_id",
  TokenAny,
  TokenAuthorize("super admin"),
  update_plan,
); // Actualizar plan

router.get(
  "/list-plans/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_plans,
); // Listar planes

router.get(
  "/list-plans-inactive/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_plans_inactive,
); // Listar planes inactivos

router.get(
  "/list-plans-active/:pag?/:perpage?",
  TokenAny,
  TokenAuthorize("super admin"),
  Paginate,
  list_plans_active,
); // Listar planes inactivos

export default router;
