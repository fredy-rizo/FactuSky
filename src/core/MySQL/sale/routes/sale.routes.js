import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  cancel_sale,
  confirm_sale,
  create_sale,
  list_sale,
  lists_sales,
  update_sale,
} from "../controllers/sale.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("sales", "view"),
  create_sale,
); // Crear venta

router.get(
  "/lists-sales/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("sales", "view"),
  Paginate,
  lists_sales,
); // Listar ventas

router.get(
  "/list-sale/:company_id/:id",
  TokenAny,
  TokenPermissions("sales", "view"),
  list_sale,
); // Listar una sola venta

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("sales", "update"),
  update_sale,
); // Actualizar venta

router.patch(
  "/cancel/:company_id/:id",
  TokenAny,
  TokenPermissions("sales", "update"),
  cancel_sale,
); // Cancelar venta

router.patch(
  "/confirm/:company_id/:id",
  TokenAny,
  TokenPermissions("sales", "update"),
  confirm_sale,
); // Confirmar venta

export default router;
