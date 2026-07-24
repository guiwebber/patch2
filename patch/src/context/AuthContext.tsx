import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  foto?: string | null;
  provedor?: string;
  administrador?: boolean;
};

type AuthContextData = {
  usuario: Usuario | null;
  token: string | null;
  estaLogado: boolean;
  ehAdministrador: boolean;
  carregandoAutenticacao: boolean;

  entrar: (
    usuario: Usuario,
    token: string,
  ) => void;

  atualizarUsuario: (
    usuario: Usuario,
  ) => void;

  sair: () => void;
};

const AuthContext =
  createContext<
    AuthContextData | undefined
  >(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    usuario,
    setUsuario,
  ] = useState<Usuario | null>(
    null,
  );

  const [
    token,
    setToken,
  ] = useState<string | null>(
    null,
  );

  const [
    carregandoAutenticacao,
    setCarregandoAutenticacao,
  ] = useState(true);

  useEffect(() => {
    try {
      const usuarioSalvo =
        localStorage.getItem(
          "usuario",
        );

      const tokenSalvo =
        localStorage.getItem(
          "token",
        );

      if (
        usuarioSalvo &&
        tokenSalvo
      ) {
        const usuarioConvertido =
          JSON.parse(
            usuarioSalvo,
          ) as Usuario;

        setUsuario(
          usuarioConvertido,
        );

        setToken(
          tokenSalvo,
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar autenticação:",
        error,
      );

      localStorage.removeItem(
        "usuario",
      );

      localStorage.removeItem(
        "token",
      );

      setUsuario(null);
      setToken(null);
    } finally {
      setCarregandoAutenticacao(
        false,
      );
    }
  }, []);

  function entrar(
    usuarioRecebido: Usuario,
    tokenRecebido: string,
  ) {
    localStorage.setItem(
      "usuario",
      JSON.stringify(
        usuarioRecebido,
      ),
    );

    localStorage.setItem(
      "token",
      tokenRecebido,
    );

    setUsuario(
      usuarioRecebido,
    );

    setToken(
      tokenRecebido,
    );
  }

  function atualizarUsuario(
    usuarioAtualizado: Usuario,
  ) {
    localStorage.setItem(
      "usuario",
      JSON.stringify(
        usuarioAtualizado,
      ),
    );

    setUsuario(
      usuarioAtualizado,
    );
  }

  function sair() {
    localStorage.removeItem(
      "usuario",
    );

    localStorage.removeItem(
      "token",
    );

    setUsuario(null);
    setToken(null);
  }

  const estaLogado =
    Boolean(
      usuario &&
      token,
    );

  const ehAdministrador =
    Boolean(
      usuario
        ?.administrador,
    );

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        estaLogado,
        ehAdministrador,
        carregandoAutenticacao,
        entrar,
        atualizarUsuario,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth precisa ser utilizado dentro do AuthProvider.",
    );
  }

  return context;
}