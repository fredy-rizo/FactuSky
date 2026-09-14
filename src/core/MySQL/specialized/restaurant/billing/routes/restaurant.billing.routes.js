import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  create_restaurant_sale,
  get_restaurant_order_bill,
  get_restaurant_payment_status,
  pay_restaurant_sale,
  validate_restaurant_checkout,
} from "../controllers/restaurant.billing.controllers.js";
const router = Router();

router.get(
  "/:company_id/order/:order_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.billing.view"),
  get_restaurant_order_bill,
); // Obtener cuenta

router.get(
  "/validate/:company_id/order/:order_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.billing.validate"),
  validate_restaurant_checkout,
); // Validar checkou

router.get(
  "/payment/:company_id/status/:order_id/order",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.billing.payment_status"),
  get_restaurant_payment_status,
); // Estado de pago

router.post(
  "/sale/:company_id/order/:order_id",
  TokenAny,
  TokenPermissions("restaurant.billing.create"),
  create_restaurant_sale,
); // Convertir orden en venta

router.post(
  "/:company_id/sale/:sale_id/pay",
  TokenAny,
  TokenPermissions("restaurant.billing.pay"),
  pay_restaurant_sale,
); // Registrar pago

export default router;
