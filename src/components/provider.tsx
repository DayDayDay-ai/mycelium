"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
type User = { id: string; name: string; username: string; role: string };
type Progress = Record<string, { status: string; studiedAt?: string }>;
type Context = {
  user: User | null;
  progress: Progress;
  ready: boolean;
  error: string;
  refresh: () => Promise<void>;
  mark: (id: string, action: "start" | "studied" | "reset") => Promise<void>;
  importGuest: () => Promise<void>;
  guestCount: number;
  logout: () => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
const KEY = "mycelium-progress-v1";
export const useLearning = () => useContext(Ctx)!;
async function request(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Ошибка запроса");
  return data;
}
export function Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [progress, setProgress] = useState<Progress>({}),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [guestCount, setGuestCount] = useState(0);
  const readGuest = (): Progress => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (!v || typeof v !== "object" || Array.isArray(v)) return {};
      return Object.fromEntries(
        Object.entries(v).filter(
          ([, entry]) =>
            entry !== null &&
            typeof entry === "object" &&
            ["NOT_STARTED", "IN_PROGRESS", "STUDIED"].includes(
              (entry as { status: string }).status,
            ),
        ),
      ) as Progress;
    } catch {
      return {};
    }
  };
  const refresh = useCallback(async () => {
    try {
      const guest = readGuest();
      setProgress(guest);
      setGuestCount(
        Object.values(guest).filter((x) => x.status === "STUDIED").length,
      );
      const account = await request("/api/auth/me");
      setUser(account);
      if (account) {
        const items = await request("/api/progress");
        setProgress(
          Object.fromEntries(
            items.map(
              (x: {
                mushroomId: string;
                status: string;
                studiedAt?: string;
              }) => [x.mushroomId, x],
            ),
          ),
        );
      } else setProgress(guest);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const mark = async (id: string, action: "start" | "studied" | "reset") => {
    setError("");
    try {
      if (user) {
        await request(`/api/progress/${id}/${action}`, {});
        await refresh();
      } else {
        const next = { ...progress };
        if (action === "reset") delete next[id];
        else if (action === "studied" || next[id]?.status !== "STUDIED")
          next[id] = {
            status: action === "studied" ? "STUDIED" : "IN_PROGRESS",
            studiedAt:
              action === "studied" ? new Date().toISOString() : undefined,
          };
        localStorage.setItem(KEY, JSON.stringify(next));
        setProgress(next);
      }
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  };
  const importGuest = async () => {
    const ids = Object.entries(readGuest())
      .filter(([, v]) => v.status === "STUDIED")
      .map(([id]) => id);
    await request("/api/progress", { ids });
    localStorage.removeItem(KEY);
    await refresh();
  };
  const logout = async () => {
    await request("/api/auth/logout", {});
    await refresh();
  };
  return (
    <Ctx.Provider
      value={{
        user,
        progress,
        ready,
        error,
        refresh,
        mark,
        importGuest,
        guestCount,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
