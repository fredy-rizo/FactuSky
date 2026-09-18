import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  create_restaurant_reservation,
  list_restaurant_reservations_by_date,
  lists_restaurant_reservations,
} from "../controllers/restaurant.reservation.controllers.js";
const router = Router();

router.post(
  "/:company_id",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.create"),
  create_restaurant_reservation,
); // Crear reserva

router.get(
  "/:company_id/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.view"),
  Paginate,
  lists_restaurant_reservations,
); // Listar reservas

router.get(
  "/:company_id/:date/date/:pag?/:perpage?",
  TokenAny,
  TokenPermissions("restaurant", "restaurant.reservations.view"),
  Paginate,
  list_restaurant_reservations_by_date,
); // Listar reservas por fecha

export default router;
