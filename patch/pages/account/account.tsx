import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  PackageSearch,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth, type Usuario } from "../../src/context/AuthContext";
import {
  ESTADOS_BRASIL,
  formatarCep,
  formatarTelefone,
  somenteLetras,
  somenteNumeros,
} from "../../src/utils/inputFormatters";

import "./account.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type Aba = "dados" | "enderecos";

type Endereco = {
  id: number;
  nome_destinatario: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

type EnderecoForm = {
  nomeDestinatario: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

const enderecoInicial: EnderecoForm = {
  nomeDestinatario: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  principal: false,
};

export default function Account() {
  const navigate = useNavigate();
  const { usuario, token, estaLogado, atualizarUsuario, sair } = useAuth();

  const [aba, setAba] = useState<Aba>("dados");
  const [nome, setNome] = useState(usuario?.nome || "");
  const [telefone, setTelefone] = useState(usuario?.telefone || "");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoForm, setEnderecoForm] =
    useState<EnderecoForm>(enderecoInicial);
  const [enderecoEditandoId, setEnderecoEditandoId] = useState<number | null>(
    null,
  );
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!estaLogado || !token) {
      navigate("/login");
      return;
    }

    void carregarPerfil();
    void carregarEnderecos();
  }, [estaLogado, token]);

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function tratarRespostaNaoAutorizada(response: Response) {
    if (response.status !== 401) {
      return false;
    }

    sair();
    navigate("/login");
    return true;
  }

  async function carregarPerfil() {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/perfil`, {
        headers: authHeaders(),
      });

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível carregar o perfil.");
        return;
      }
      const cliente = data.cliente as Usuario;

      const clienteAtualizado: Usuario = {
        ...usuario,
        ...cliente,
        administrador: cliente.administrador ?? usuario?.administrador ?? false,
      };

      setNome(clienteAtualizado.nome);
      setTelefone(clienteAtualizado.telefone || "");
      atualizarUsuario(clienteAtualizado);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    }
  }

  async function carregarEnderecos() {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/enderecos`, {
        headers: authHeaders(),
      });

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível carregar os endereços.");
        return;
      }

      setEnderecos(data.enderecos || []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    }
  }

  function limparAvisos() {
    setErro("");
    setMensagem("");
  }

  async function salvarDados(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    limparAvisos();

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    if (nome.trim().length < 3) {
      setErro("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (telefoneNumeros && ![10, 11].includes(telefoneNumeros.length)) {
      setErro("Informe um telefone válido com DDD.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(`${API_URL}/perfil`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.replace(/\D/g, ""),
        }),
      });

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível atualizar o perfil.");
        return;
      }

      atualizarUsuario(data.cliente);
      setMensagem(data.mensagem);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    limparAvisos();

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      setErro("Preencha todos os campos de senha.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(`${API_URL}/perfil/senha`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmarNovaSenha,
        }),
      });

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível alterar a senha.");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setMensagem(data.mensagem);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  function editarEndereco(endereco: Endereco) {
    setEnderecoEditandoId(endereco.id);
    setEnderecoForm({
      nomeDestinatario: endereco.nome_destinatario,
      cep: formatarCep(endereco.cep),
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento || "",
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      principal: endereco.principal,
    });
    setMostrarFormulario(true);
    limparAvisos();
  }

  function novoEndereco() {
    setEnderecoEditandoId(null);
    setEnderecoForm(enderecoInicial);
    setMostrarFormulario(true);
    limparAvisos();
  }

  function fecharFormularioEndereco() {
    setMostrarFormulario(false);
    setEnderecoEditandoId(null);
    setEnderecoForm(enderecoInicial);
  }

  async function salvarEndereco(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    limparAvisos();

    const camposObrigatorios = [
      enderecoForm.nomeDestinatario,
      enderecoForm.cep,
      enderecoForm.rua,
      enderecoForm.numero,
      enderecoForm.bairro,
      enderecoForm.cidade,
      enderecoForm.estado,
    ];

    if (camposObrigatorios.some((campo: string) => !campo.trim())) {
      setErro("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    if (enderecoForm.cep.replace(/\D/g, "").length !== 8) {
      setErro("Informe um CEP válido com 8 números.");
      return;
    }

    const editando = enderecoEditandoId !== null;

    try {
      setCarregando(true);

      const response = await fetch(
        editando
          ? `${API_URL}/enderecos/${enderecoEditandoId}`
          : `${API_URL}/enderecos`,
        {
          method: editando ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            ...enderecoForm,
            cep: enderecoForm.cep.replace(/\D/g, ""),
          }),
        },
      );

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível salvar o endereço.");
        return;
      }

      fecharFormularioEndereco();
      setMensagem(data.mensagem);
      await carregarEnderecos();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function excluirEndereco(id: number) {
    const confirmar = window.confirm("Deseja realmente excluir este endereço?");

    if (!confirmar) return;

    limparAvisos();

    try {
      const response = await fetch(`${API_URL}/enderecos/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (await tratarRespostaNaoAutorizada(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || "Não foi possível excluir o endereço.");
        return;
      }

      setMensagem(data.mensagem);
      await carregarEnderecos();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível conectar ao servidor.");
    }
  }

  if (!usuario) {
    return <main className="account-loading">Carregando sua conta...</main>;
  }

  return (
    <main className="account-page">
      <section className="account-shell">
        <aside className="account-sidebar">
          <div className="account-user-card">
            {usuario.foto ? (
              <img
                src={usuario.foto}
                alt={usuario.nome}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{usuario.nome.charAt(0).toUpperCase()}</span>
            )}

            <div>
              <strong>{usuario.nome}</strong>
              <small>{usuario.email}</small>
            </div>
          </div>

          <button
            type="button"
            className={aba === "dados" ? "active" : ""}
            onClick={() => {
              setAba("dados");
              limparAvisos();
            }}
          >
            <UserRound size={20} />
            Dados pessoais
          </button>

          <button
            type="button"
            className={aba === "enderecos" ? "active" : ""}
            onClick={() => {
              setAba("enderecos");
              limparAvisos();
            }}
          >
            <MapPin size={20} />
            Endereços
          </button>

          <button type="button" onClick={() => navigate("/meus-pedidos")}>
            <PackageSearch size={20} />
            Meus pedidos
          </button>

          {usuario?.administrador && (
            <button type="button" onClick={() => navigate("/admin")}>
              <ShieldCheck size={20} />
              Painel administrativo
            </button>
          )}
        </aside>

        <section className="account-content">
          <div className="account-heading">
            <span>Minha conta</span>
            <h1>
              {aba === "dados" ? "Informações pessoais" : "Meus endereços"}
            </h1>
          </div>

          {erro && <div className="account-alert error">{erro}</div>}

          {mensagem && <div className="account-alert success">{mensagem}</div>}

          {aba === "dados" ? (
            <>
              <form
                className="account-card account-form"
                onSubmit={salvarDados}
              >
                <div className="account-card-title">
                  <UserRound size={22} />
                  <div>
                    <h2>Dados da conta</h2>
                    <p>Atualize seu nome e telefone.</p>
                  </div>
                </div>

                <div className="account-form-grid">
                  <label>
                    <span>Nome completo</span>
                    <input
                      type="text"
                      value={nome}
                      onChange={(event) =>
                        setNome(somenteLetras(event.target.value))
                      }
                    />
                  </label>

                  <label>
                    <span>Telefone</span>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(event) =>
                        setTelefone(formatarTelefone(event.target.value))
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </label>

                  <label className="full">
                    <span>E-mail</span>
                    <input type="email" value={usuario.email} disabled />
                    <small>O e-mail não pode ser alterado por aqui.</small>
                  </label>
                </div>

                <button
                  type="submit"
                  className="account-primary-button"
                  disabled={carregando}
                >
                  <Save size={19} />
                  {carregando ? "Salvando..." : "Salvar alterações"}
                </button>
              </form>

              <form
                className="account-card account-form"
                onSubmit={salvarSenha}
              >
                <div className="account-card-title">
                  <KeyRound size={22} />
                  <div>
                    <h2>Alterar senha</h2>
                    <p>Use uma senha segura com pelo menos seis caracteres.</p>
                  </div>
                </div>

                {usuario.provedor === "google" ? (
                  <div className="google-password-info">
                    Sua conta utiliza login com Google e não possui uma senha
                    local para alterar.
                  </div>
                ) : (
                  <>
                    <div className="account-form-grid">
                      <label className="full">
                        <span>Senha atual</span>
                        <div className="password-field">
                          <input
                            type={mostrarSenhas ? "text" : "password"}
                            value={senhaAtual}
                            onChange={(event) =>
                              setSenhaAtual(event.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setMostrarSenhas((current) => !current)
                            }
                          >
                            {mostrarSenhas ? (
                              <EyeOff size={19} />
                            ) : (
                              <Eye size={19} />
                            )}
                          </button>
                        </div>
                      </label>

                      <label>
                        <span>Nova senha</span>
                        <input
                          type={mostrarSenhas ? "text" : "password"}
                          value={novaSenha}
                          onChange={(event) => setNovaSenha(event.target.value)}
                        />
                      </label>

                      <label>
                        <span>Confirmar nova senha</span>
                        <input
                          type={mostrarSenhas ? "text" : "password"}
                          value={confirmarNovaSenha}
                          onChange={(event) =>
                            setConfirmarNovaSenha(event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="account-primary-button"
                      disabled={carregando}
                    >
                      <KeyRound size={19} />
                      Alterar senha
                    </button>
                  </>
                )}
              </form>
            </>
          ) : (
            <>
              <div className="address-toolbar">
                <p>Cadastre os locais usados para entrega dos seus pedidos.</p>

                <button type="button" onClick={novoEndereco}>
                  <Plus size={19} />
                  Novo endereço
                </button>
              </div>

              {enderecos.length === 0 ? (
                <div className="empty-addresses">
                  <MapPin size={58} />
                  <h2>Nenhum endereço cadastrado</h2>
                  <p>
                    Adicione seu primeiro endereço para facilitar futuras
                    compras.
                  </p>
                  <button type="button" onClick={novoEndereco}>
                    Cadastrar endereço
                  </button>
                </div>
              ) : (
                <div className="address-grid">
                  {enderecos.map((endereco) => (
                    <article className="address-card" key={endereco.id}>
                      {endereco.principal && (
                        <span className="main-address">Principal</span>
                      )}

                      <h3>{endereco.nome_destinatario}</h3>

                      <p>
                        {endereco.rua}, {endereco.numero}
                      </p>

                      {endereco.complemento && <p>{endereco.complemento}</p>}

                      <p>
                        {endereco.bairro} — {endereco.cidade}/{endereco.estado}
                      </p>

                      <p>CEP: {endereco.cep}</p>

                      <div className="address-actions">
                        <button
                          type="button"
                          onClick={() => editarEndereco(endereco)}
                        >
                          <Pencil size={17} />
                          Editar
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => excluirEndereco(endereco.id)}
                        >
                          <Trash2 size={17} />
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </section>

      {mostrarFormulario && (
        <div
          className="address-modal-overlay"
          onMouseDown={fecharFormularioEndereco}
        >
          <form
            className="address-modal"
            onSubmit={salvarEndereco}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="address-modal-close"
              onClick={fecharFormularioEndereco}
            >
              <X size={22} />
            </button>

            <div className="account-card-title">
              <MapPin size={22} />
              <div>
                <h2>
                  {enderecoEditandoId ? "Editar endereço" : "Novo endereço"}
                </h2>
                <p>Preencha os dados usados para entrega.</p>
              </div>
            </div>

            <div className="address-form-grid">
              <label className="full">
                <span>Nome do destinatário</span>
                <input
                  value={enderecoForm.nomeDestinatario}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      nomeDestinatario: somenteLetras(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                <span>CEP</span>
                <input
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  value={enderecoForm.cep}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      cep: formatarCep(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={enderecoForm.estado}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      estado: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecione</option>

                  {ESTADOS_BRASIL.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.sigla} — {estado.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full">
                <span>Rua</span>
                <input
                  value={enderecoForm.rua}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      rua: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Número</span>
                <input
                  inputMode="numeric"
                  value={enderecoForm.numero}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      numero: somenteNumeros(event.target.value, 8),
                    }))
                  }
                />
              </label>

              <label>
                <span>Complemento</span>
                <input
                  value={enderecoForm.complemento}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      complemento: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Bairro</span>
                <input
                  value={enderecoForm.bairro}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      bairro: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Cidade</span>
                <input
                  value={enderecoForm.cidade}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      cidade: somenteLetras(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="address-checkbox full">
                <input
                  type="checkbox"
                  checked={enderecoForm.principal}
                  onChange={(event) =>
                    setEnderecoForm((current) => ({
                      ...current,
                      principal: event.target.checked,
                    }))
                  }
                />
                <span>Usar como endereço principal</span>
              </label>
            </div>

            <button
              type="submit"
              className="account-primary-button"
              disabled={carregando}
            >
              <Save size={19} />
              {carregando ? "Salvando..." : "Salvar endereço"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
