import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  doctorQuerySchema,
} from "../validators/doctor.validator.js";
import * as doctorController from "../controllers/doctor.controller.js";

const router = Router();

router.get(
  "/",
  validateRequest(doctorQuerySchema),
  doctorController.getAllDoctors
);

router.get("/:id", doctorController.getDoctorById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  validateRequest(createDoctorSchema),
  doctorController.createDoctor
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  validateRequest(updateDoctorSchema),
  doctorController.updateDoctor
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  doctorController.deleteDoctor
);

export default router;
