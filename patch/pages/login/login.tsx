import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../src/context/AuthContext";

import "./login.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

type LoginLocationState = {
  redirectTo?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entrar } = useAuth();

  const locationState =
    location.state as LoginLocationState | null;

  const redirectTo =
    locationState?.redirectTo || "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] =
    useState(false);
  const [
    carregandoGoogle,
    setCarregandoGoogle,
  ] = useState(false);

  function concluirLogin(
    cliente: Parameters<
      typeof entrar
    >[0],
    token: string,
  ) {
    entrar(cliente, token);

    navigate(redirectTo, {
      replace: true,
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            senha,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setErro(
          data.erro ||
            "Não foi possível entrar.",
        );
        return;
      }

      if (!data.token || !data.cliente) {
        setErro(
          "O servidor não retornou os dados do login.",
        );
        return;
      }

      concluirLogin(data.cliente, data.token);
    } catch (error) {
      console.error(
        "Erro ao realizar login:",
        error,
      );

      setErro(
        "Não foi possível conectar ao servidor.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function handleGoogleLogin(
    responseGoogle: CredentialResponse,
  ) {
    const credential =
      responseGoogle.credential;

    if (!credential) {
      setErro(
        "O Google não retornou uma credencial válida.",
      );
      return;
    }

    try {
      setErro("");
      setCarregandoGoogle(true);

      const response = await fetch(
        `${API_URL}/login/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setErro(
          data.erro ||
            "Não foi possível entrar com o Google.",
        );
        return;
      }

      if (!data.token || !data.cliente) {
        setErro(
          "O servidor não retornou os dados do login.",
        );
        return;
      }

      concluirLogin(data.cliente, data.token);
    } catch (error) {
      console.error(
        "Erro no login Google:",
        error,
      );

      setErro(
        "Não foi possível conectar ao servidor.",
      );
    } finally {
      setCarregandoGoogle(false);
    }
  }

  const bloqueado =
    carregando || carregandoGoogle;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="auth-brand-tag">
            PatchWork
          </span>

          <h1>Bem-vindo de volta</h1>

          <p>
            Entre na sua conta para acompanhar seus
            pedidos e continuar suas compras.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-form-header">
            <h2>Entrar</h2>

            <p>
              Digite seus dados para acessar sua conta.
            </p>
          </div>

          {redirectTo === "/checkout" && (
            <div className="auth-info">
              Entre para continuar sua compra.
            </div>
          )}

          {erro && (
            <div className="auth-error">
              {erro}
            </div>
          )}

          <label className="auth-field">
            <span>E-mail</span>

            <div className="auth-input-wrapper">
              <Mail size={20} />

              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                disabled={bloqueado}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Senha</span>

            <div className="auth-input-wrapper">
              <LockKeyhole size={20} />

              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                autoComplete="current-password"
                disabled={bloqueado}
              />

              <button
                type="button"
                className="auth-password-button"
                onClick={() =>
                  setMostrarSenha(
                    (valor) => !valor,
                  )
                }
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                disabled={bloqueado}
              >
                {mostrarSenha ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </label>

          <div className="auth-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                disabled={bloqueado}
              />
              <span>Lembrar de mim</span>
            </label>

            <button
              type="button"
              className="auth-link-button"
              disabled={bloqueado}
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={bloqueado}
          >
            {carregando
              ? "Entrando..."
              : "Entrar"}
          </button>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <div className="google-login-wrapper">
            {carregandoGoogle ? (
              <p className="google-loading">
                Entrando com Google...
              </p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() =>
                  setErro(
                    "O login com o Google falhou.",
                  )
                }
                text="signin_with"
                shape="rectangular"
                size="large"
                theme="outline"
                width="350"
              />
            )}
          </div>

          <p className="auth-footer">
            Ainda não tem uma conta?{" "}
            <Link
              to="/signup"
              state={{
                redirectTo,
              }}
            >
              Cadastre-se
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
