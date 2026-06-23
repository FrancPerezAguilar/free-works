/**
 * LoginPage — pantalla de inicio de sesión / registro.
 *
 * - Dos modos: `login` (email + contraseña) y `register`
 *   (nombre + email + contraseña + confirmar contraseña).
 * - Muestra errores de Appwrite en lenguaje humano.
 * - Tras login/registro exitoso, redirige a la ruta original
 *   (`location.state.from.pathname`) o a `/` por defecto.
 */

import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Wrench, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

type Mode = "login" | "register";

interface LocationState {
  from?: { pathname?: string };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Appwrite lanza AppwriteException con `message` legible y `code`.
    const msg = err.message || "";
    const lower = msg.toLowerCase();
    if (lower.includes("invalid credentials") || lower.includes("user_invalid")) {
      return "Email o contraseña incorrectos.";
    }
    if (lower.includes("user_already_exists") || lower.includes("already")) {
      return "Ya existe una cuenta con ese email.";
    }
    if (lower.includes("password") && lower.includes("short")) {
      return "La contraseña es demasiado corta (mínimo 8 caracteres).";
    }
    if (lower.includes("email") && lower.includes("invalid")) {
      return "El email no es válido.";
    }
    if (lower.includes("rate") || lower.includes("limit")) {
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    }
    return msg || "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
  }
  return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as LocationState | null)?.from?.pathname || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Si por lo que sea el usuario ya está autenticado y entra en /login,
  // lo mandamos al destino (o al dashboard).
  if (user) {
    return <Navigate to={fromPath} replace />;
  }

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setError(null);
  };

  const toggleMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (!name.trim()) {
        setError("Introduce tu nombre.");
        return;
      }
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo / cabecera */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md mb-3">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Free Works</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestor inteligente de trabajos para autónomos
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isRegister
              ? "Empieza a gestionar tus trabajos en minutos."
              : "Accede a tu cuenta para continuar."}
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={isRegister ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : isRegister ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isRegister ? "Crear cuenta" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("login")}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Inicia sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("register")}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Free Works
        </p>
      </div>
    </div>
  );
}
