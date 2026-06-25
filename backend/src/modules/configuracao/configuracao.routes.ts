import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { configuracaoSchema } from "./configuracao.schema";
import { buscar, salvar, remover } from "./configuracao.controller";

const router = Router();

router.get("/", buscar);
router.post("/", validate(configuracaoSchema), salvar);
router.delete("/", remover);

export default router;
