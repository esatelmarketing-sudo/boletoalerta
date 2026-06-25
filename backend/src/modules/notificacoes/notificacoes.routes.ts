import { Router } from "express";
import { listar, reenviar } from "./notificacoes.controller";

const router = Router();

router.get("/", listar);
router.post("/:id/reenviar", reenviar);

export default router;
