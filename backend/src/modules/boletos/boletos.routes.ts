import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { boletoSchema, boletoUpdateSchema } from "./boletos.schema";
import { listar, buscarPorId, criar, atualizar, marcarPago, cancelar } from "./boletos.controller";

const router = Router();

router.get("/", listar);
router.get("/:id", buscarPorId);
router.post("/", validate(boletoSchema), criar);
router.put("/:id", validate(boletoUpdateSchema), atualizar);
router.patch("/:id/pagar", marcarPago);
router.patch("/:id/cancelar", cancelar);

export default router;
