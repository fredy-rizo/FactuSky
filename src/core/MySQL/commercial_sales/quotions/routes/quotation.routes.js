import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import {
  accept_quotation,
  convert_quotation_to_order,
  create_quotation,
  list_quotation,
  lists_quotations,
  reject_quotation,
  send_quotation,
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

router.patch(
  "/:company_id/send/:id",
  TokenAny,
  TokenPermissions("quotations", "update"),
  send_quotation,
); // Enviar cotizacion

router.patch(
  "/:company_id/accept/:id",
  TokenAny,
  TokenPermissions("quotations", "update"),
  accept_quotation,
); // Aceptar cotizacion

router.patch(
  "/:company_id/reject/:id",
  TokenAny,
  TokenPermissions("quotation", "update"),
  reject_quotation,
); // Rechazar cotizacion

router.post(
  "/:company_id/convert-order/:id",
  TokenAny,
  TokenPermissions("quotations", "convert"),
  convert_quotation_to_order,
); // Convertir cotizacion en pedido

export default router;
