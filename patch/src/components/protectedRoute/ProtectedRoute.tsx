import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { estaLogado } = useAuth();
  const location = useLocation();

  if (!estaLogado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          redirectTo:
            location.pathname + location.search,
        }}
      />
    );
  }

  return children;
}
