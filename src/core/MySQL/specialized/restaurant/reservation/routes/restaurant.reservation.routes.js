import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  arrive_restaurant_reservation,
  cancel_restaurant_reservation,
  confirm_restaurant_reservation,
  create_restaurant_reservation,
  list_restaurant_reservations_by_date,
  lists_restaurant_reservations,
  no_show_restaurant_reservation,
  restaurant_reservation_availability,
  update_restaurant_reservation,
} from "../controllers/restaurant.reservation.controllers.js";
const router = Router();

router.post(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.create"),
  create_restaurant_reservation,
); // Crear reserva

router.get(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.view"),
  Paginate,
  lists_restaurant_reservations,
); // Listar reservas

router.get(
  "/:company_id/:date/date",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.view"),
  Paginate,
  list_restaurant_reservations_by_date,
); // Listar reservas por fecha

router.get(
  "/:company_id/availability",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.view"),
  restaurant_reservation_availability,
); // Consultar disponibilidad

router.put(
  "/update/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.update"),
  update_restaurant_reservation,
); // Actualizar reserva

router.patch(
  "/confirm/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.confirm"),
  confirm_restaurant_reservation,
); // Confirmar reserva

router.patch(
  "/arrive/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.arrive"),
  arrive_restaurant_reservation,
); // Cliente llego

router.patch(
  "/cancel/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.cancel"),
  cancel_restaurant_reservation,
); // Cancelar reserva

router.patch(
  "/no-show/:company_id/:id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.no_show"),
  no_show_restaurant_reservation,
); // No-show en reserva

export default router;
