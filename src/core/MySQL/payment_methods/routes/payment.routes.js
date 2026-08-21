import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../middleware/utils/paginate.js";
import {
  create_payment,
  list_payment,
  list_payments,
  remove_payment,
  update_payment,
} from "../controllers/payment.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("payment_methods", "create"),
  create_payment,
); // Crear metodos de pago

router.get(
  "/list-payments/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("payment_methods", "view"),
  Paginate,
  list_payments,
); // Listar metodos de pago

router.get(
  "/list-payment/:company_id/:id",
  TokenAny,
  TokenPermissions("payment_methods", "view"),
  list_payment,
); // Listar un solo metodo de pago

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("payment_methods", "update"),
  update_payment,
); // Actualizar metodo de pago

router.delete(
  "/remove/:company_id/:id",
  TokenAny,
  TokenPermissions("payment_methods", "delete"),
  remove_payment,
); // Eliminar metodo de pago

export default router;
