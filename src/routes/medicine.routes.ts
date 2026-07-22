import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/upload.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
  medicineQuerySchema,
} from "../validators/medicine.validator.js";
import * as medicineController from "../controllers/medicine.controller.js";

const router = Router();

router.get(
  "/",
  validateRequest(medicineQuerySchema),
  medicineController.getAllMedicines
);

router.get("/search", medicineController.searchMedicines);
router.get("/categories", medicineController.getCategories);
router.get("/featured", medicineController.getFeaturedMedicines);
router.get("/:id", medicineController.getMedicineById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("image"),
  validateRequest(createMedicineSchema),
  medicineController.createMedicine
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("image"),
  validateRequest(updateMedicineSchema),
  medicineController.updateMedicine
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("image"),
  validateRequest(updateMedicineSchema),
  medicineController.updateMedicine
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  medicineController.deleteMedicine
);

export default router;
