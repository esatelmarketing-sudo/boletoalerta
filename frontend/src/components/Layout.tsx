import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Bell, Settings, LogOut, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/boletos", icon: FileText, label: "Boletos" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/notificacoes", icon: Bell, label: "Notificações" },
  { to: "/configuracao", icon: Settings, label: "Configuração" },
];

export function Layout() {
  const { empresa, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">BoletoAlerta</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{empresa?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{empresa?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
