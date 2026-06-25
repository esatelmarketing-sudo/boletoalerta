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
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post("/auth/login", data);
      login(res.data.token, res.data.empresa);
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erro ao fazer login");
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
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Entrar</h1>
          <p className="text-sm text-gray-500 mb-6">Acesse o painel da sua empresa</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="E-mail" type="email" placeholder="empresa@email.com" error={errors.email?.message} required {...register("email")} />
            <Input label="Senha" type="password" placeholder="••••••••" error={errors.senha?.message} required {...register("senha")} />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
