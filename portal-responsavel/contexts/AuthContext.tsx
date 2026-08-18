"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole } from "@/types";

const ROLE_PADRAO: UserRole = "pai";

function éUserRole(valor: unknown): valor is UserRole {
  return (
    valor === "pai" ||
    valor === "secretaria" ||
    valor === "direcao" ||
    valor === "coordenacao_pedagogica" ||
    valor === "coordenacao_disciplinar" ||
    valor === "financeiro"
  );
}

type AuthContextValue = {
  user: User | null;
  /**
   * Perfil do usuário, lido de `users/{uid}.role` no Firestore após o login.
   * `null` só enquanto ninguém está logado ou a busca do perfil ainda não
   * terminou — nunca fica `null` pra um usuário autenticado (cai em "pai").
   */
  role: UserRole | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelarInscricao = onAuthStateChanged(auth, async (usuarioAtual) => {
      setUser(usuarioAtual);

      if (!usuarioAtual) {
        setRole(null);
        setCarregando(false);
        return;
      }

      // Busca o perfil (role) em users/{uid}. Se o documento não existir ou
      // não tiver o campo `role`, assume "pai" — mesma regra pra qualquer
      // responsável que já tinha conta antes dessa feature existir.
      try {
        const perfilSnap = await getDoc(doc(db, "users", usuarioAtual.uid));
        const roleSalva = perfilSnap.exists() ? perfilSnap.data().role : undefined;
        setRole(éUserRole(roleSalva) ? roleSalva : ROLE_PADRAO);
      } catch (erro) {
        console.error("Erro ao buscar o perfil (role) do usuário:", erro);
        setRole(ROLE_PADRAO);
      } finally {
        setCarregando(false);
      }
    });
    return cancelarInscricao;
  }, []);

  async function login(email: string, senha: string) {
    await signInWithEmailAndPassword(auth, email, senha);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, role, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de um <AuthProvider>");
  }
  return contexto;
}
