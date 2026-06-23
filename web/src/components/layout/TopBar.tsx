import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, User as UserIcon, Wrench } from "lucide-react";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { useAuth } from "@/lib/AuthContext";

function getInitials(name: string, email: string): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+|@/).filter(Boolean);
  if (parts.length === 0) return source[0]!.toUpperCase();
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function TopBar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = SIDEBAR_ITEMS.find((i) =>
    i.path === "/" ? location.pathname === "/" : location.pathname.startsWith(i.path)
  );

  const displayName = user?.name || user?.email || "Usuario";
  const initials = getInitials(user?.name || "", user?.email || "");

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-100 transition-colors"
            aria-label="Menú de usuario"
            aria-expanded={menuOpen}
          >
            <span className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[160px] truncate">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback: si por alguna razón no hay user (no debería verse
          porque TopBar está dentro de rutas protegidas, pero por si
          el auth tarda en propagarse) */}
      {!user && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </header>
  );
}
