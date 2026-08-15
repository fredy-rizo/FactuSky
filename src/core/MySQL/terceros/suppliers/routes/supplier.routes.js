import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../../middleware/tools/segurity.js";
import { Paginate } from "../../../../../middleware/utils/paginate.js";
import { create_supplier } from "../controllers/supplier.controllers.js";
const router = Router();

router.post(
  "/create",
  TokenAny,
  TokenPermissions("products.views"),
  create_supplier,
); // Crear proveedor

export default router;
