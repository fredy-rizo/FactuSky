import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../../middleware/utils/paginate.js";
import {
  activate_room_type,
  create_room_type,
  deactivate_room_type,
  get_room_type,
  get_room_type_statistics,
  list_room_types,
  update_room_type,
} from "../controllers/hotel.room.types.controllers.js";
const router = Router();

router.post(
  "/hotel/:company_id",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.create"),
  create_room_type,
); // Crear tipo de habitacion

router.get(
  "/:company_id/room-types/:id",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.view"),
  get_room_type,
); // Listar una sola habitación

router.get(
  "/:company_id/room-types",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.view"),
  Paginate,
  list_room_types,
); // Listar todas las habitaciones

router.put(
  "/update/:company_id/room-types/:id",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.update"),
  update_room_type,
); // Actualizar habitacion

router.patch(
  "/patch/:company_id/room-types/:id/deactivate",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.deactivate"),
  deactivate_room_type,
); // Desactivar habitacion

router.patch(
  "/patch/:company_id/room-types/:id/activate",
  TokenAny,
  TokenPermissions("hotel", "hotel.room.types.activate"),
  activate_room_type,
); // Reactivar habitacion

router.get(
  "/statistics/:company_id/room-type",
  TokenAny,
  TokenPermissions("hotel", "hote.room.types.statistics"),
  get_room_type_statistics,
); // Estadisticas de las habitaciones

export default router;
