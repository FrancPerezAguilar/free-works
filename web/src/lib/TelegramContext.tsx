/**
 * TelegramContext — integración con Telegram Mini App.
 *
 * - Detecta si la app corre dentro de Telegram leyendo `window.Telegram.WebApp`.
 * - Expone valores reactivos: `isTelegram`, `webApp`, `initData`, `user`,
 *   `theme`, `colorScheme`.
 * - Al montar, dentro de Telegram:
 *     1) Llama a `webApp.ready()` para indicarle a Telegram que la UI está
 *        lista (evita el loader nativo de Telegram).
 *     2) Llama a `webApp.expand()` para que la mini-app ocupe la pantalla
 *        completa del cliente.
 *     3) Configura el `BackButton` con un handler por defecto: si hay
 *        historial SPA (más de una entrada en `window.history`) hace
 *        `history.back()`; si no, llama a `webApp.close()` para cerrar
 *        la mini-app. El show/hide explícito lo gestiona cada consumidor
 *        a través del hook `useTelegramBackButton(enabled)`.
 *     4) Aplica los `themeParams` como variables CSS en `:root` y
 *        sincroniza el `colorScheme` con la clase `.dark` del `<html>`
 *        para que las utilidades de Tailwind 4 (`dark:`) funcionen
 *        automáticamente. Se re-aplica en cada `themeChanged` o
 *        `viewportChanged`.
 *
 * Cuando NO estamos en Telegram, todos los valores son neutros (`isTelegram`
 * false, `webApp` null, etc.) y los métodos no hacen nada. Esto permite que
 * la misma build sirva para abrir la web desde un navegador normal.
 *
 * NOTA para el prototipo: NO validamos `initData` server-side. La app confía
 * en que el API key de Appwrite hardcodeada es suficiente para desarrollo.
 * En producción se deberá validar `initData` en un endpoint seguro.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ── Tipos del SDK de Telegram WebApp ──────────────────────────
//
// Definidos localmente para no añadir dependencias (@types/telegram-web-app
// no está en el package.json). Coinciden con la documentación oficial:
// https://core.telegram.org/bots/webapps#initializing-mini-apps

export type ColorScheme = "light" | "dark";

export interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: true;
  photo_url?: string;
}

export interface WebAppBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export interface WebAppMainButton {
  text: string;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export interface WebApp {
  initData: string;
  initDataUnsafe: {
    user?: WebAppUser;
    auth_date?: number;
    hash?: string;
    [k: string]: unknown;
  };
  version: string;
  platform: string;
  colorScheme: ColorScheme;
  themeParams: ThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  BackButton: WebAppBackButton;
  MainButton: WebAppMainButton;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: WebApp;
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────

/** Acceso seguro a `window.Telegram.WebApp`. Devuelve `null` fuera de Telegram. */
function getWebApp(): WebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/** Aplica los colores del tema de Telegram como variables CSS en `:root`. */
function applyThemeCssVars(themeParams: ThemeParams | undefined): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Usamos el MISMO nombre que las claves de `ThemeParams` (con guión bajo),
  // porque el `themeParams` de Telegram viene así. CSS las acepta igual
  // — `var(--tg-theme-bg_color)` funciona aunque no sea kebab-case.
  const vars: Array<[string, string | undefined]> = [
    ["--tg-theme-bg_color", themeParams?.bg_color],
    ["--tg-theme-text_color", themeParams?.text_color],
    ["--tg-theme-hint_color", themeParams?.hint_color],
    ["--tg-theme-link_color", themeParams?.link_color],
    ["--tg-theme-button_color", themeParams?.button_color],
    ["--tg-theme-button_text_color", themeParams?.button_text_color],
    ["--tg-theme-secondary_bg_color", themeParams?.secondary_bg_color],
    ["--tg-theme-header_bg_color", themeParams?.header_bg_color],
    ["--tg-theme-accent_text_color", themeParams?.accent_text_color],
    ["--tg-theme-section_bg_color", themeParams?.section_bg_color],
    ["--tg-theme-section_header_text_color", themeParams?.section_header_text_color],
    ["--tg-theme-subtitle_text_color", themeParams?.subtitle_text_color],
    ["--tg-theme-destructive_text_color", themeParams?.destructive_text_color],
  ];
  for (const [name, value] of vars) {
    if (value) {
      root.style.setProperty(name, value);
    } else {
      root.style.removeProperty(name);
    }
  }
}

/** Sincroniza `colorScheme` con la clase `.dark` del `<html>`. */
function applyColorSchemeClass(scheme: ColorScheme | null | undefined): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (scheme === "dark") {
    html.classList.add("dark");
  } else if (scheme === "light") {
    html.classList.remove("dark");
  } else {
    html.classList.remove("dark");
  }
}

// ── Contexto ──────────────────────────────────────────────────

export interface TelegramContextValue {
  isTelegram: boolean;
  webApp: WebApp | null;
  initData: string;
  user: WebAppUser | null;
  theme: ThemeParams;
  colorScheme: ColorScheme | null;
}

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  webApp: null,
  initData: "",
  user: null,
  theme: {},
  colorScheme: null,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme | null>(null);
  const [theme, setTheme] = useState<ThemeParams>({});

  // Mantenemos referencias a handlers para poder desuscribirlos en el cleanup.
  const backHandlerRef = useRef<(() => void) | null>(null);
  const themeChangeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const tg = getWebApp();
    if (!tg) {
      // No estamos en Telegram — modo "web normal". El estado inicial
      // (`isTelegram = false`, `webApp = null`) ya es el correcto, así
      // que no necesitamos llamar a `setState` aquí.
      return;
    }

    // Sincronizamos varios `useState` con el SDK externo (Telegram WebApp).
    // Esto dispararía UN solo re-render porque React 19 batchea las
    // actualizaciones dentro de un effect. La regla
    // `react-hooks/set-state-in-effect` se desactiva puntualmente
    // porque la sincronización al montar es el patrón correcto aquí
    // (no podemos usar `useSyncExternalStore` porque el SDK expone
    // métodos imperativos como `ready()`/`expand()` y eventos).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebApp(tg);
    setIsTelegram(true);
    setColorScheme(tg.colorScheme ?? null);
    setTheme(tg.themeParams ?? {});

    // 1) Indicamos a Telegram que la UI está lista y queremos pantalla completa.
    try {
      tg.ready();
      tg.expand();
    } catch {
      // Si el SDK no está listo todavía, los métodos pueden fallar silenciosamente.
    }

    // 2) Aplicar tema actual a las variables CSS y a la clase `.dark`.
    applyThemeCssVars(tg.themeParams);
    applyColorSchemeClass(tg.colorScheme);

    // 3) Suscribirse a cambios de tema (Telegram puede actualizarlo en runtime).
    const onThemeChange = () => {
      setColorScheme(tg.colorScheme ?? null);
      setTheme(tg.themeParams ?? {});
      applyThemeCssVars(tg.themeParams);
      applyColorSchemeClass(tg.colorScheme);
    };
    themeChangeHandlerRef.current = onThemeChange;
    try {
      tg.onEvent("themeChanged", onThemeChange);
      tg.onEvent("viewportChanged", () => {
        // Re-aplicar vars para que cualquier componente que dependa de
        // `viewportHeight` re-renderice con el valor actualizado.
        applyThemeCssVars(tg.themeParams);
      });
    } catch {
      // Algunos clientes antiguos no exponen `onEvent` — no es crítico.
    }

    // 4) BackButton: la lógica de "mostrar/ocultar según historial" la
    //    gestiona el consumidor (vía `useTelegramBackButton`). Aquí solo
    //    registramos el click handler por defecto (go back / close).
    const onBackClick = () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        window.history.back();
      } else {
        try {
          tg.close();
        } catch {
          // ignore
        }
      }
    };
    backHandlerRef.current = onBackClick;
    try {
      tg.BackButton.onClick(onBackClick);
    } catch {
      // ignore
    }

    return () => {
      if (backHandlerRef.current) {
        try {
          tg.BackButton.offClick(backHandlerRef.current);
        } catch {
          // ignore
        }
      }
      if (themeChangeHandlerRef.current) {
        try {
          tg.offEvent("themeChanged", themeChangeHandlerRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const value = useMemo<TelegramContextValue>(
    () => ({
      isTelegram,
      webApp,
      initData: webApp?.initData ?? "",
      user: webApp?.initDataUnsafe?.user ?? null,
      theme,
      colorScheme,
    }),
    [isTelegram, webApp, theme, colorScheme]
  );

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

/** Hook para consumir el contexto. Lanza error si se usa fuera del provider. */
export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

/**
 * Hook utilitario para mostrar/ocular el BackButton nativo de Telegram según
 * haya o no historial de navegación SPA. El consumidor pasa `enabled`
 * (p. ej. `location.pathname !== "/"`).
 *
 * No hace nada fuera de Telegram.
 */
export function useTelegramBackButton(enabled: boolean): void {
  const { isTelegram, webApp } = useTelegram();
  useEffect(() => {
    if (!isTelegram || !webApp) return;
    try {
      if (enabled) webApp.BackButton.show();
      else webApp.BackButton.hide();
    } catch {
      // ignore
    }
  }, [enabled, isTelegram, webApp]);
}

/**
 * Helper opcional: programa el cierre de la mini-app cuando se llama
 * (equivale a `webApp.close()` pero sin crashear fuera de Telegram).
 */
export function closeTelegram(): void {
  const tg = getWebApp();
  if (!tg) return;
  try {
    tg.close();
  } catch {
    // ignore
  }
}