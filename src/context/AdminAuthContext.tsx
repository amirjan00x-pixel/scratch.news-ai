import { createContext, useContext, useEffect, useState } from "react";

interface AdminAuthContextValue {
  isAdmin: boolean;
  adminKey: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const STORAGE_KEY = "news_admin_key";
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const attemptAuth = async (key: string, options?: { silent?: boolean }) => {
    if (!key) {
      if (!options?.silent) setAuthError("Admin key is required");
      return false;
    }

    if (!options?.silent) {
      setIsAuthenticating(true);
      setAuthError(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/authenticate`, {
        method: "POST",
        headers: {
          "x-api-key": key,
        },
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      setIsAdmin(true);
      setAdminKey(key);
      sessionStorage.setItem(STORAGE_KEY, key);
      return true;
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
      setIsAdmin(false);
      setAdminKey(null);
      if (!options?.silent) {
        setAuthError("Invalid admin key");
      }
      return false;
    } finally {
      if (!options?.silent) {
        setIsAuthenticating(false);
      }
    }
  };

  useEffect(() => {
    const storedKey = sessionStorage.getItem(STORAGE_KEY);
    if (storedKey) {
      attemptAuth(storedKey, { silent: true });
    }
  }, []);

  const login = async (key: string) => {
    return attemptAuth(key);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdmin(false);
    setAdminKey(null);
    setAuthError(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        adminKey,
        isAuthenticating,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
