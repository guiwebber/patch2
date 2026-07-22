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
import { Link, useNavigate } from "react-router-dom";

import "../login/login.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Signup() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);
  const [erro, setErro] = useState("");
  const [carregandoGoogle, setCarregandoGoogle] =
    useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErro("");

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      setErro(
        "Preencha todos os campos obrigatórios.",
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

    console.log({
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim().toLowerCase(),
      senha,
    });

    // Depois ligaremos este cadastro normal ao backend.
    navigate("/login");
  }

  async function handleGoogleSignup(
    responseGoogle: CredentialResponse,
  ) {
    const credential = responseGoogle.credential;

    if (!credential) {
      setErro("O Google não retornou uma credencial válida.");
      return;
    }

    try {
      setErro("");
      setCarregandoGoogle(true);

      // A mesma rota serve para cadastro e login.
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
            "Não foi possível cadastrar com o Google.",
        );
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.cliente),
      );

      navigate("/");
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
                  setNome(event.target.value)
                }
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Telefone</span>

            <div className="auth-input-wrapper">
              <Phone size={20} />

              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(event) =>
                  setTelefone(event.target.value)
                }
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
              />
            </div>
          </label>

          <button
            type="submit"
            className="auth-submit"
          >
            Criar conta
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
            <Link to="/login">Entrar</Link>
          </p>
        </form>
      </section>
    </main>
  );
}