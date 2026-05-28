import { NavLink } from "react-router-dom";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard, Users, Wrench, FileText,
  Receipt, Target, Package, Calendar,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Wrench, FileText,
  Receipt, Target, Package, Calendar,
};

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 h-full bg-white border-r">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Autónomos
        </h1>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
