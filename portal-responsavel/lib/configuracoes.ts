"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ConfiguracaoAgenda } from "@/types";

const CONFIGURACOES_COLLECTION = "configuracoes";
const AGENDA_DOC_ID = "agenda";

/**
 * Configuração usada até a escola salvar pela primeira vez (o documento
 * `configuracoes/agenda` ainda não existe em Firestore recém-criado) — sem
 * isso, o AgendamentoForm ficaria sem nenhum dia/horário disponível na
 * primeira execução do app.
 */
export const CONFIGURACAO_PADRAO: ConfiguracaoAgenda = {
  diasDisponiveis: [1, 2, 3, 4, 5], // Segunda a sexta (convenção Date.getDay())
  horariosDisponiveis: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
};

function agendaDocRef() {
  return doc(db, CONFIGURACOES_COLLECTION, AGENDA_DOC_ID);
}

function normalizar(dado: Record<string, unknown> | undefined): ConfiguracaoAgenda {
  if (!dado) return CONFIGURACAO_PADRAO;
  return {
    diasDisponiveis: Array.isArray(dado.diasDisponiveis)
      ? (dado.diasDisponiveis as number[])
      : CONFIGURACAO_PADRAO.diasDisponiveis,
    horariosDisponiveis: Array.isArray(dado.horariosDisponiveis)
      ? (dado.horariosDisponiveis as string[])
      : CONFIGURACAO_PADRAO.horariosDisponiveis,
  };
}

/**
 * Busca pontual (não tempo real) da configuração — usada pelo AgendamentoForm
 * ao montar o calendário. Uma leitura única é suficiente ali: o formulário é
 * uma sessão curta, não precisa reagir a uma mudança de configuração no meio
 * do preenchimento.
 */
export async function buscarConfiguracaoAgenda(): Promise<ConfiguracaoAgenda> {
  const snapshot = await getDoc(agendaDocRef());
  return normalizar(snapshot.exists() ? snapshot.data() : undefined);
}

/**
 * Hook em tempo real — usado na tela de Configurações do admin, onde faz
 * sentido refletir imediatamente o que está salvo (e o que outro
 * funcionário eventualmente mudar).
 */
export function useConfiguracaoAgenda() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoAgenda>(CONFIGURACAO_PADRAO);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelarInscricao = onSnapshot(
      agendaDocRef(),
      (snapshot) => {
        setConfiguracao(normalizar(snapshot.exists() ? snapshot.data() : undefined));
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir configuração da agenda:", erro);
        setCarregando(false);
      }
    );
    return cancelarInscricao;
  }, []);

  return { configuracao, carregando };
}

/** Sobrescreve o documento configuracoes/agenda — chamado pela tela de Configurações. */
export async function salvarConfiguracaoAgenda(
  configuracao: ConfiguracaoAgenda
): Promise<void> {
  await setDoc(agendaDocRef(), configuracao);
}
