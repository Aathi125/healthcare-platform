import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const TOKEN_KEY = "sh_token";
const USER_KEY = "sh_user";

const AuthContext = createContext(null);

const parseStoredUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const roleHomePath = (role) => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DOCTOR") return "/doctor/dashboard";
  return "/patient/dashboard";
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(parseStoredUser());
  const [loading, setLoading] = useState(true);

  const applyAuthData = ({ token: nextToken, user: nextUser }) => {
    if (!nextToken || !nextUser) return;
    saveSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    applyAuthData(data);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (user) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } catch {
        clearSession();
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      applyAuthData
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
