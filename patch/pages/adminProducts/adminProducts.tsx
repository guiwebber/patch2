import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import type { Product } from "../../types/product";
import "./adminProducts.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type FormState = {
  nome: string; categoria: string; descricao: string;
  preco: string; precoAntigo: string; imagem: string; imagensTexto: string;
  destaque: boolean; ativo: boolean;
  peso: string; altura: string; largura: string; comprimento: string;
  producaoMinDias: string; producaoMaxDias: string;
};

const vazio: FormState = {
  nome: "", categoria: "", descricao: "", preco: "", precoAntigo: "",
  imagem: "", imagensTexto: "", destaque: false, ativo: true,
  peso: "", altura: "", largura: "", comprimento: "",
  producaoMinDias: "", producaoMaxDias: "",
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const { token, sair } = useAuth();
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(vazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      setCarregando(true);
      const response = await fetch(`${API_URL}/admin/produtos`, { headers });
      if (response.status === 401) { sair(); navigate("/login"); return; }
      if (response.status === 403) { navigate("/"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Erro ao carregar produtos.");
      setProdutos(data.produtos || []);
      setErro("");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar produtos.");
    } finally { setCarregando(false); }
  }, [headers, navigate, sair, token]);

  useEffect(() => { void carregar(); }, [carregar]);

  function abrirNovo() {
    setEditandoId(null); setForm(vazio); setErro(""); setMensagem(""); setModalAberto(true);
  }

  function abrirEdicao(produto: Product) {
    setEditandoId(produto.id);
    setForm({
      nome: produto.name, categoria: produto.category, descricao: produto.description,
      preco: String(produto.price), precoAntigo: produto.oldPrice ? String(produto.oldPrice) : "",
      imagem: produto.image, imagensTexto: (produto.images || []).join("\n"),
      destaque: Boolean(produto.featured), ativo: produto.active !== false,
      peso: String(produto.peso), altura: String(produto.altura),
      largura: String(produto.largura), comprimento: String(produto.comprimento),
      producaoMinDias: String(produto.producaoMinDias),
      producaoMaxDias: String(produto.producaoMaxDias),
    });
    setErro(""); setMensagem(""); setModalAberto(true);
  }

  function payload() {
    return {
      ...form,
      preco: Number(form.preco),
      precoAntigo: form.precoAntigo ? Number(form.precoAntigo) : null,
      imagens: form.imagensTexto.split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean),
      peso: Number(form.peso), altura: Number(form.altura),
      largura: Number(form.largura), comprimento: Number(form.comprimento),
      producaoMinDias: Number(form.producaoMinDias),
      producaoMaxDias: Number(form.producaoMaxDias),
    };
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSalvando(true); setErro("");
      const url = editandoId ? `${API_URL}/admin/produtos/${editandoId}` : `${API_URL}/admin/produtos`;
      const response = await fetch(url, {
        method: editandoId ? "PUT" : "POST", headers, body: JSON.stringify(payload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível salvar.");
      setMensagem(data.mensagem); setModalAberto(false); await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar produto.");
    } finally { setSalvando(false); }
  }

  async function alternarAtivo(produto: Product) {
    const response = await fetch(`${API_URL}/admin/produtos/${produto.id}/ativo`, {
      method: "PATCH", headers, body: JSON.stringify({ ativo: produto.active === false }),
    });
    const data = await response.json();
    if (!response.ok) { setErro(data.erro || "Erro ao alterar produto."); return; }
    setMensagem(data.mensagem); await carregar();
  }

  async function excluir(produto: Product) {
    if (!window.confirm(`Remover “${produto.name}” da loja?`)) return;
    const response = await fetch(`${API_URL}/admin/produtos/${produto.id}`, {
      method: "DELETE", headers,
    });
    const data = await response.json();
    if (!response.ok) { setErro(data.erro || "Erro ao excluir produto."); return; }
    setMensagem(data.mensagem); await carregar();
  }

  if (carregando) return <main className="products-admin-loading"><LoaderCircle className="products-admin-spin" /> Carregando produtos...</main>;

  return (
    <main className="products-admin-page">
      <section className="products-admin-shell">
        <header className="products-admin-header">
          <div>
            <button className="products-admin-back" onClick={() => navigate("/admin")}><ArrowLeft size={18}/> Pedidos</button>
            <span>Administração</span><h1>Produtos da loja</h1>
            <p>Cadastre, edite, oculte e remova produtos sem alterar o código.</p>
          </div>
          <button className="products-admin-new" onClick={abrirNovo}><Plus size={19}/> Novo produto</button>
        </header>

        {erro && <div className="products-admin-alert error">{erro}</div>}
        {mensagem && <div className="products-admin-alert success">{mensagem}</div>}

        <section className="products-admin-grid">
          {produtos.map((produto) => (
            <article className={`products-admin-card ${produto.active === false ? "inactive" : ""}`} key={produto.id}>
              <img src={produto.image} alt={produto.name}/>
              <div className="products-admin-card-content">
                <div className="products-admin-badges">
                  <span>{produto.category}</span>
                  {produto.featured && <span>Destaque</span>}
                  {produto.oldPrice && <span>Oferta</span>}
                  {produto.active === false && <span>Oculto</span>}
                </div>
                <h2>{produto.name}</h2>
                <strong>{produto.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                <small>{produto.peso} kg · {produto.altura} × {produto.largura} × {produto.comprimento} cm</small>
                <div className="products-admin-actions">
                  <button onClick={() => abrirEdicao(produto)}><Pencil size={17}/> Editar</button>
                  <button onClick={() => void alternarAtivo(produto)}>{produto.active === false ? <Eye size={17}/> : <EyeOff size={17}/>} {produto.active === false ? "Ativar" : "Ocultar"}</button>
                  <button className="delete" onClick={() => void excluir(produto)}><Trash2 size={17}/> Excluir</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>

      {modalAberto && (
        <div className="products-admin-overlay" onMouseDown={() => setModalAberto(false)}>
          <form className="products-admin-modal" onSubmit={salvar} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="products-admin-close" onClick={() => setModalAberto(false)}><X/></button>
            <h2>{editandoId ? "Editar produto" : "Cadastrar produto"}</h2>
            <div className="products-admin-form-grid">
              <label><span>Nome</span><input required value={form.nome} onChange={(e) => setForm({...form,nome:e.target.value})}/></label>
              <label><span>Categoria</span><input required value={form.categoria} onChange={(e) => setForm({...form,categoria:e.target.value})}/></label>
              <label className="full"><span>Descrição</span><textarea required value={form.descricao} onChange={(e) => setForm({...form,descricao:e.target.value})}/></label>
              <label><span>Preço</span><input required type="number" min="0.01" step="0.01" value={form.preco} onChange={(e) => setForm({...form,preco:e.target.value})}/></label>
              <label><span>Preço antigo (opcional)</span><input type="number" min="0.01" step="0.01" value={form.precoAntigo} onChange={(e) => setForm({...form,precoAntigo:e.target.value})}/></label>
              <label className="full"><span>Imagem principal (URL)</span><input required type="url" value={form.imagem} onChange={(e) => setForm({...form,imagem:e.target.value})}/></label>
              <label className="full"><span>Outras imagens — uma URL por linha</span><textarea value={form.imagensTexto} onChange={(e) => setForm({...form,imagensTexto:e.target.value})}/></label>
              <label><span>Peso (kg)</span><input required type="number" min="0.001" step="0.001" value={form.peso} onChange={(e) => setForm({...form,peso:e.target.value})}/></label>
              <label><span>Altura (cm)</span><input required type="number" min="1" step="0.1" value={form.altura} onChange={(e) => setForm({...form,altura:e.target.value})}/></label>
              <label><span>Largura (cm)</span><input required type="number" min="1" step="0.1" value={form.largura} onChange={(e) => setForm({...form,largura:e.target.value})}/></label>
              <label><span>Comprimento (cm)</span><input required type="number" min="1" step="0.1" value={form.comprimento} onChange={(e) => setForm({...form,comprimento:e.target.value})}/></label>
              <label><span>Produção mínima (dias)</span><input required type="number" min="0" step="1" value={form.producaoMinDias} onChange={(e) => setForm({...form,producaoMinDias:e.target.value})}/></label>
              <label><span>Produção máxima (dias)</span><input required type="number" min="0" step="1" value={form.producaoMaxDias} onChange={(e) => setForm({...form,producaoMaxDias:e.target.value})}/></label>
              <label className="check"><input type="checkbox" checked={form.destaque} onChange={(e) => setForm({...form,destaque:e.target.checked})}/> Destaque</label>
              <label className="check"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({...form,ativo:e.target.checked})}/> Produto ativo</label>
            </div>
            <button className="products-admin-save" disabled={salvando}><Save size={18}/> {salvando ? "Salvando..." : "Salvar produto"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
