import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type UserRole = "citizen" | "officer";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("officer");

  const setUserRole = useCallback((next: UserRole) => {
    console.log("RoleContext: setUserRole called with", next);
    setRole(next);
    try {
      localStorage.setItem("reportbox.role", next);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("reportbox.role");
      if (saved === "citizen" || saved === "officer") {
        setRole(saved);
      }
    } catch {
      // keep default
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole: setUserRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
