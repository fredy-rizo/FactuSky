import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import {
  dashboard_report,
  sales_summary,
} from "../controllers/reports.controllers.js";
const router = Router();

router.get(
  "/:company_id/dashboard",
  TokenAny,
  TokenPermissions("reports", "view"),
  dashboard_report,
); // Dashboard

router.get(
  "/sale/:company_id/summary",
  TokenAny,
  TokenPermissions("reports", "view", sales_summary),
); // Ventas

export default router;
