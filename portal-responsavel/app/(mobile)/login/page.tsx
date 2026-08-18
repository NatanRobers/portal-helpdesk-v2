"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Loader2, LogIn, Eye, EyeOff } from "lucide-react";

function mensagemDeErro(codigo: string) {
  switch (codigo) {
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um instante e tente novamente.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export default function LoginPage() {
  const { user, role, carregando, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Só decide pra onde mandar depois que `carregando` vira false — até lá,
  // o AuthContext ainda pode estar buscando o `role` em users/{uid} no
  // Firestore, e decidir com um valor incompleto mandaria um funcionário
  // pra Home dos pais por engano (o bug que estávamos vendo).
  useEffect(() => {
    if (carregando || !user) return;

    if (role && role !== "pai") {
      router.replace("/admin");
    } else {
      router.replace("/");
    }
  }, [carregando, user, role, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
      // Sem redirect aqui de propósito: `login()` só resolve o sign-in do
      // Firebase Auth — o `role` ainda não foi buscado nesse instante.
      // O useEffect acima cuida do redirect assim que `carregando` virar
      // false (ou seja, depois que o role já chegou do Firestore).
      // `enviando` continua true nesse meio-tempo — o spinner do botão
      // segue girando até a navegação acontecer, sem "piscar" pra um
      // estado destravado no meio do caminho.
    } catch (err) {
      const codigo =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      setErro(mensagemDeErro(codigo));
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-navy-900 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-white">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <GraduationCap size={28} />
          </span>
          <h1 className="font-display text-xl font-semibold">
            Portal do Responsável
          </h1>
          <p className="mt-1 text-sm text-sky-200">
            Entre para acompanhar seu filho
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl2 bg-white p-6 shadow-card"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-navy-800"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="responsavel@email.com"
              className="w-full rounded-xl2 border border-sky-100 bg-sky-50 px-4 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-600/40 focus:border-sky-400"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-1.5 block text-[13px] font-medium text-navy-800"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl2 border border-sky-100 bg-sky-50 px-4 py-2.5 pr-11 text-sm text-navy-900 outline-none placeholder:text-navy-600/40 focus:border-sky-400"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-600/50"
              >
                {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-navy-900 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <LogIn size={17} />
            )}
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-sky-200/70">
          Problemas para acessar? Fale com a secretaria da escola.
        </p>
      </div>
    </div>
  );
}
