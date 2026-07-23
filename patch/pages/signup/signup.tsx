import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  User,
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
import {
  formatarTelefone,
  somenteLetras,
} from "../../src/utils/inputFormatters";

import "../login/login.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

type SignupLocationState = {
  redirectTo?: string;
};

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entrar } = useAuth();

  const state =
    location.state as SignupLocationState | null;

  const redirectTo = state?.redirectTo || "/";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] =
    useState(false);
  const [carregandoGoogle, setCarregandoGoogle] =
    useState(false);

  function tratarContaExistente(
    status: number,
    mensagem: string,
  ) {
    if (status !== 409) {
      return false;
    }

    window.alert(mensagem);

    navigate("/login", {
      replace: true,
      state: {
        redirectTo,
      },
    });

    return true;
  }

  function concluirCadastro(
    cliente: Parameters<typeof entrar>[0],
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

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      setErro(
        "Preencha todos os campos obrigatórios.",
      );
      return;
    }

    if (nome.trim().length < 3) {
      setErro(
        "Informe um nome com pelo menos 3 caracteres.",
      );
      return;
    }

    const telefoneNumeros =
      telefone.replace(/\D/g, "");

    if (
      telefoneNumeros &&
      ![10, 11].includes(telefoneNumeros.length)
    ) {
      setErro(
        "Informe um telefone válido com DDD.",
      );
      return;
    }

    if (senha.length < 6) {
      setErro(
        "A senha precisa ter pelo menos 6 caracteres.",
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(
        `${API_URL}/clientes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nome.trim(),
            telefone: telefoneNumeros,
            email: email.trim().toLowerCase(),
            senha,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const mensagem =
          data.erro ||
          "Não foi possível criar sua conta.";

        if (
          tratarContaExistente(
            response.status,
            mensagem,
          )
        ) {
          return;
        }

        setErro(mensagem);
        return;
      }

      if (!data.token || !data.cliente) {
        setErro(
          "O servidor não retornou os dados do cadastro.",
        );
        return;
      }

      concluirCadastro(
        data.cliente,
        data.token,
      );
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setErro(
        "Não foi possível conectar ao servidor.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function handleGoogleSignup(
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
        `${API_URL}/cadastro/google`,
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
        const mensagem =
          data.erro ||
          "Não foi possível cadastrar com o Google.";

        if (
          tratarContaExistente(
            response.status,
            mensagem,
          )
        ) {
          return;
        }

        setErro(mensagem);
        return;
      }

      if (!data.token || !data.cliente) {
        setErro(
          "O servidor não retornou os dados do cadastro.",
        );
        return;
      }

      concluirCadastro(
        data.cliente,
        data.token,
      );
    } catch (error) {
      console.error(
        "Erro no cadastro Google:",
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

          <h1>Crie sua conta</h1>

          <p>
            Cadastre-se para salvar seus pedidos,
            endereços e favoritos.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-form-header">
            <h2>Cadastro</h2>
            <p>
              Preencha seus dados para começar.
            </p>
          </div>

          {erro && (
            <div className="auth-error">
              {erro}
            </div>
          )}

          <label className="auth-field">
            <span>Nome completo</span>

            <div className="auth-input-wrapper">
              <User size={20} />

              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(event) =>
                  setNome(
                    somenteLetras(
                      event.target.value,
                    ),
                  )
                }
                autoComplete="name"
                disabled={bloqueado}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Telefone</span>

            <div className="auth-input-wrapper">
              <Phone size={20} />

              <input
                type="tel"
                inputMode="numeric"
                maxLength={15}
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(event) =>
                  setTelefone(
                    formatarTelefone(
                      event.target.value,
                    ),
                  )
                }
                autoComplete="tel"
                disabled={bloqueado}
              />
            </div>
          </label>

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
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                autoComplete="new-password"
                disabled={bloqueado}
              />

              <button
                type="button"
                className="auth-password-button"
                onClick={() =>
                  setMostrarSenha(
                    (current) => !current,
                  )
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

          <label className="auth-field">
            <span>Confirmar senha</span>

            <div className="auth-input-wrapper">
              <LockKeyhole size={20} />

              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChange={(event) =>
                  setConfirmarSenha(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                disabled={bloqueado}
              />
            </div>
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={bloqueado}
          >
            {carregando
              ? "Criando conta..."
              : "Criar conta"}
          </button>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <div className="google-login-wrapper">
            {carregandoGoogle ? (
              <p className="google-loading">
                Cadastrando com Google...
              </p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() =>
                  setErro(
                    "O cadastro com o Google falhou.",
                  )
                }
                text="signup_with"
                shape="rectangular"
                size="large"
                theme="outline"
                width="350"
              />
            )}
          </div>

          <p className="auth-footer">
            Já possui uma conta?{" "}
            <Link
              to="/login"
              state={{
                redirectTo,
              }}
            >
              Entrar
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
