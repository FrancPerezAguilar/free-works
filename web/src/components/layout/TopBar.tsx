import { useLocation } from "react-router-dom";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { Wrench } from "lucide-react";

export function TopBar() {
  const location = useLocation();
  const current = SIDEBAR_ITEMS.find((i) =>
    i.path === "/" ? location.pathname === "/" : location.pathname.startsWith(i.path)
  );

  return (
    <header className="h-14 border-b bg-white flex items-center px-4 md:px-6 gap-4">
      <div className="md:hidden flex items-center gap-2 font-bold text-sm">
        <Wrench className="h-5 w-5 text-blue-600" />
        Autónomos
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-900 font-medium">{current?.label || "Dashboard"}</span>
      </div>
      <div className="flex-1" />
    </header>
  );
}
