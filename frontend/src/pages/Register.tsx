import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(8, "Mínimo 8 caracteres"),
  cnpj: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post("/auth/register", data);
      login(res.data.token, res.data.empresa);
      navigate("/");
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erro ao criar conta");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">BoletoAlerta</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Criar conta</h1>
          <p className="text-sm text-gray-500 mb-6">Comece a usar o BoletoAlerta gratuitamente</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Nome da empresa" placeholder="Minha Empresa Ltda" error={errors.nome?.message} required {...register("nome")} />
            <Input label="CNPJ" placeholder="00.000.000/0001-00" error={errors.cnpj?.message} {...register("cnpj")} />
            <Input label="E-mail" type="email" placeholder="contato@empresa.com" error={errors.email?.message} required {...register("email")} />
            <Input label="Senha" type="password" placeholder="Mínimo 8 caracteres" error={errors.senha?.message} required {...register("senha")} />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
