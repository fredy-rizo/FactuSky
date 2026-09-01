import { Router } from "express";
import {
  TokenAny,
  TokenPermissions,
} from "../../../../middleware/tools/segurity.js";
import { dashboard_report } from "../controllers/reports.controllers.js";
const router = Router();

router.get(
  "/:company_id/dashboard",
  TokenAny,
  TokenPermissions("reports", "view"),
  dashboard_report,
); // Dashboard

export default router;
