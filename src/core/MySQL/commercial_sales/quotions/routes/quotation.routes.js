import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  create_quotation,
  list_quotation,
  lists_quotations,
} from "../controllers/quotation.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("quotations", "create"),
  create_quotation,
); // Crear cotizacion

router.get(
  "/lists/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("quotations", "view"),
  Paginate,
  lists_quotations,
); // Listar cotizaciones

router.get(
  "/list/:company_id/:id",
  TokenAny,
  TokenPermissions("quotations", "view"),
  list_quotation,
); // Ver una cotizacion

export default router;
