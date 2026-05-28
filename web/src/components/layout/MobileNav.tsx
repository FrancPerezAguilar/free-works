import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard, Wrench, Users, Calendar, Receipt,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Wrench, Users, Calendar, Receipt,
};

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-2 z-50">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-xs transition-colors ${
                isActive
                  ? "text-blue-700 font-medium"
                  : "text-gray-500"
              }`
            }
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
