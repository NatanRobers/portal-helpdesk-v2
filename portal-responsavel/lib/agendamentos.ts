"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Agendamento, AgendamentoStatus, SetorAgendamento, UserRole } from "@/types";

const AGENDAMENTOS_COLLECTION = "agendamentos";

/**
 * Data de hoje em YYYY-MM-DD no fuso LOCAL do navegador — não usa
 * `toISOString()` porque esse método converte pra UTC, e perto da meia-noite
 * (ex.: 22h em horário de Brasília, UTC-3) isso devolve o dia SEGUINTE como
 * "hoje", quebrando qualquer regra de "não deixar marcar no passado".
 */
export function hojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function converterDocParaAgendamento(
  id: string,
  dado: Record<string, unknown>
): Agendamento {
  const dataCriacao = dado.dataCriacao as Timestamp | null;
  return {
    id,
    setor: dado.setor as SetorAgendamento,
    data: dado.data as string,
    horario: dado.horario as string,
    motivo: dado.motivo as string,
    status: dado.status as AgendamentoStatus,
    solicitanteId: dado.solicitanteId as string,
    dataCriacao: dataCriacao ? dataCriacao.toMillis() : null,
  };
}

/** Cria um novo agendamento com status inicial CONFIRMADO. */
export async function criarAgendamento(params: {
  setor: SetorAgendamento;
  data: string;
  horario: string;
  motivo: string;
  solicitanteId: string;
}): Promise<Agendamento> {
  const { setor, data, horario, motivo, solicitanteId } = params;

  const novoAgendamento = {
    setor,
    data,
    horario,
    motivo,
    status: "CONFIRMADO" as const,
    solicitanteId,
    dataCriacao: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, AGENDAMENTOS_COLLECTION), novoAgendamento);

  return {
    id: docRef.id,
    setor,
    data,
    horario,
    motivo,
    status: "CONFIRMADO",
    solicitanteId,
    dataCriacao: null,
  };
}

/**
 * Hook que ouve em tempo real os agendamentos futuros (data >= hoje) de um
 * solicitante, do mais próximo para o mais distante.
 *
 * Nota: essa combinação de `where` (igualdade em solicitanteId + intervalo
 * em `data`) e dois `orderBy` exige um índice composto no Firestore. Na
 * primeira execução, o console do navegador mostra um link do próprio
 * Firebase pra criar esse índice com um clique — ou publique o
 * `firestore.indexes.json` deste projeto via Firebase CLI.
 */
export function useAgendamentosDoSolicitante(solicitanteId: string | null) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!solicitanteId) {
      setAgendamentos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const hoje = hojeISO();

    const agendamentosQuery = query(
      collection(db, AGENDAMENTOS_COLLECTION),
      where("solicitanteId", "==", solicitanteId),
      where("data", ">=", hoje),
      orderBy("data", "asc"),
      orderBy("horario", "asc")
    );

    const cancelarInscricao = onSnapshot(
      agendamentosQuery,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) =>
          converterDocParaAgendamento(docSnap.id, docSnap.data())
        );
        setAgendamentos(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir agendamentos do solicitante:", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [solicitanteId]);

  return { agendamentos, carregando };
}

/**
 * Consulta pontual (não é tempo real — `getDocs`, não `onSnapshot`) dos
 * horários já ocupados numa data + setor específicos, considerando só
 * agendamentos CONFIRMADO (um CANCELADO libera o horário de novo).
 * Chamada toda vez que o usuário escolhe um dia no calendário, pra alimentar
 * a regra de conflito (double-booking) do Passo 3.
 */
export async function buscarHorariosOcupados(
  data: string,
  setor: SetorAgendamento
): Promise<string[]> {
  const ocupadosQuery = query(
    collection(db, AGENDAMENTOS_COLLECTION),
    where("data", "==", data),
    where("setor", "==", setor),
    where("status", "==", "CONFIRMADO")
  );

  const snapshot = await getDocs(ocupadosQuery);
  return snapshot.docs.map((docSnap) => docSnap.data().horario as string);
}

/**
 * Cancela um agendamento — muda `status` para "CANCELADO". Não apaga o
 * documento (mantém histórico) e, como `buscarHorariosOcupados` só considera
 * status "CONFIRMADO", o horário fica livre pra outra pessoa automaticamente,
 * sem precisar de nenhuma lógica extra aqui.
 */
export async function cancelarAgendamento(agendamentoId: string): Promise<void> {
  await updateDoc(doc(db, AGENDAMENTOS_COLLECTION, agendamentoId), {
    status: "CANCELADO" as const,
  });
}

// ---------------------------------------------------------------------------
// Backoffice (/admin/agendamentos)
// ---------------------------------------------------------------------------

/**
 * Hook pra Agenda de Reuniões do backoffice — lista os agendamentos que o
 * setor do funcionário logado deve ver, em tempo real.
 *
 * Recebe `role` como parâmetro (mesmo padrão de `useTicketsAdmin`) em vez de
 * chamar `useAuth()` aqui dentro, mantendo esse módulo desacoplado do
 * AuthContext.
 *
 * Filtro por setor:
 * - "direcao" → sem filtro, vê todos os agendamentos (visão global).
 * - "coordenacao_pedagogica" / "coordenacao_disciplinar" → `setor == "coordenacao"`
 *   (as duas coordenações dividem o mesmo `SetorAgendamento`; não existe
 *   "coordenacao_pedagogica" como valor de `setor` no agendamento em si).
 * - "secretaria" / "financeiro" → `setor == role` (os nomes batem 1:1).
 */
export function useAgendamentosAdmin(role: UserRole | null) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!role || role === "pai") {
      setAgendamentos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const restricoes: QueryConstraint[] = [];
    if (role === "coordenacao_pedagogica" || role === "coordenacao_disciplinar") {
      restricoes.push(where("setor", "==", "coordenacao"));
    } else if (role === "secretaria" || role === "financeiro") {
      restricoes.push(where("setor", "==", role));
    }
    // role === "direcao": nenhuma restrição — vê a agenda inteira.

    const agendamentosQuery = query(
      collection(db, AGENDAMENTOS_COLLECTION),
      ...restricoes,
      orderBy("data", "asc"),
      orderBy("horario", "asc")
    );

    const cancelarInscricao = onSnapshot(
      agendamentosQuery,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) =>
          converterDocParaAgendamento(docSnap.id, docSnap.data())
        );
        setAgendamentos(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir agendamentos (admin):", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [role]);

  return { agendamentos, carregando };
}

/**
 * Atualiza o status de um agendamento pelo backoffice — usado pelo <select>
 * da Agenda de Reuniões. Diferente de `cancelarAgendamento` (que só permite
 * CANCELADO e é chamada pelo próprio responsável), esta aceita qualquer um
 * dos três status, porque quem chama é a escola.
 */
export async function atualizarStatusAgendamento(
  agendamentoId: string,
  novoStatus: AgendamentoStatus
): Promise<void> {
  await updateDoc(doc(db, AGENDAMENTOS_COLLECTION, agendamentoId), { status: novoStatus });
}

/**
 * Remarca um agendamento — atualiza `data` e `horario` juntos, numa única
 * escrita. Deliberadamente separada de `atualizarStatusAgendamento`: são
 * duas ações distintas na UI (o `<select>` de status vs. o modal "Remarcar"),
 * e a regra do Firestore trata as duas como operações que não podem se
 * misturar no mesmo `update` (ver firestore.rules).
 */
export async function remarcarAgendamento(
  agendamentoId: string,
  novaData: string,
  novoHorario: string
): Promise<void> {
  await updateDoc(doc(db, AGENDAMENTOS_COLLECTION, agendamentoId), {
    data: novaData,
    horario: novoHorario,
  });
}
