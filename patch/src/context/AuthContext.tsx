import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  foto?: string | null;
  provedor?: string;
};

type AuthContextData = {
  usuario: Usuario | null;
  token: string | null;
  estaLogado: boolean;
  entrar: (usuario: Usuario, token: string) => void;
  sair: () => void;
};

const AuthContext = createContext<AuthContextData | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    const tokenSalvo = localStorage.getItem("token");

    if (usuarioSalvo && tokenSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
        setToken(tokenSalvo);
      } catch {
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
      }
    }
  }, []);

  function entrar(usuarioRecebido: Usuario, tokenRecebido: string) {
    localStorage.setItem(
      "usuario",
      JSON.stringify(usuarioRecebido),
    );

    localStorage.setItem("token", tokenRecebido);

    setUsuario(usuarioRecebido);
    setToken(tokenRecebido);
  }

  function sair() {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");

    setUsuario(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        estaLogado: Boolean(usuario && token),
        entrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth precisa ser utilizado dentro do AuthProvider.",
    );
  }

  return context;
}