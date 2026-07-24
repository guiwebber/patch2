import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

export default function AdminRoute() {
  const {
    estaLogado,
    ehAdministrador,
  } = useAuth();

  if (!estaLogado) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!ehAdministrador) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}
