import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

export default function AdminRoute() {
  const location =
    useLocation();

  const {
    estaLogado,
    ehAdministrador,
    carregandoAutenticacao,
  } = useAuth();

  if (
    carregandoAutenticacao
  ) {
    return (
      <main
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          background: "#fffaf5",
          color: "#5b4b42",
          fontWeight: 700,
        }}
      >
        Verificando acesso...
      </main>
    );
  }

  if (!estaLogado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
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