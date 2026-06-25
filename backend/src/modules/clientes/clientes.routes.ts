import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { clienteSchema, clienteUpdateSchema } from "./clientes.schema";
import { listar, buscarPorId, criar, atualizar, remover } from "./clientes.controller";

const router = Router();

router.get("/", listar);
router.get("/:id", buscarPorId);
router.post("/", validate(clienteSchema), criar);
router.put("/:id", validate(clienteUpdateSchema), atualizar);
router.delete("/:id", remover);

export default router;
