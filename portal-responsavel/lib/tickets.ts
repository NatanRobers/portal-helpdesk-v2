"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MensagemTicket,
  SegmentoAluno,
  Ticket,
  TicketOrigem,
  TicketPrioridade,
  TicketStatus,
  TicketTipo,
  UserRole,
} from "@/types";

const TICKETS_COLLECTION = "tickets";
const COUNTER_DOC_PATH = ["counters", "tickets"] as const;

/**
 * Primeiro número de ticket emitido, caso o contador ainda não exista.
 * Começar em 1000 é só estética (tickets com 4 dígitos desde o início).
 */
const PRIMEIRO_NUMERO_TICKET = 1000;

function converterDocParaTicket(id: string, dado: Record<string, unknown>): Ticket {
  const dataCriacao = dado.dataCriacao as Timestamp | null;
  return {
    id,
    tipo: dado.tipo as TicketTipo,
    resumo: dado.resumo as string,
    descricao: dado.descricao as string,
    prioridade: dado.prioridade as TicketPrioridade,
    status: dado.status as Ticket["status"],
    segmento: dado.segmento as SegmentoAluno,
    origem: dado.origem as TicketOrigem,
    solicitanteId: dado.solicitanteId as string,
    avaliacao: typeof dado.avaliacao === "number" ? dado.avaliacao : undefined,
    dataCriacao: dataCriacao ? dataCriacao.toMillis() : null,
  };
}

/**
 * Gera o próximo número sequencial de ticket via transação sobre
 * counters/tickets — evita que dois usuários abrindo um ticket ao mesmo
 * tempo recebam o mesmo número (condição de corrida).
 */
async function proximoNumeroDeTicket(): Promise<number> {
  const counterRef = doc(db, ...COUNTER_DOC_PATH);

  return runTransaction(db, async (transacao) => {
    const snapshot = await transacao.get(counterRef);

    const numeroAtual = snapshot.exists()
      ? (snapshot.data().ultimoNumero as number)
      : PRIMEIRO_NUMERO_TICKET - 1;

    const proximoNumero = numeroAtual + 1;
    transacao.set(counterRef, { ultimoNumero: proximoNumero }, { merge: true });

    return proximoNumero;
  });
}

/**
 * Cria um novo ticket com ID legível (ex: "TICKET-1001") e status inicial
 * ABERTO. Retorna o ticket já criado (com o dataCriacao ainda null — o valor
 * real só existe depois que o servidor confirma o serverTimestamp()).
 *
 * `segmento` é obrigatório: como o app roda como WebView dentro do app
 * principal da escola, não temos contexto prévio de qual aluno/segmento está
 * por trás da solicitação — todo ticket (formulário OU bot) precisa informar.
 */
export async function criarTicket(params: {
  tipo: TicketTipo;
  resumo: string;
  descricao: string;
  prioridade: TicketPrioridade;
  segmento: SegmentoAluno;
  solicitanteId: string;
  /** Default "FORMULARIO" — o bot de triagem passa "BOT" explicitamente. */
  origem?: TicketOrigem;
}): Promise<Ticket> {
  const {
    tipo,
    resumo,
    descricao,
    prioridade,
    segmento,
    solicitanteId,
    origem = "FORMULARIO",
  } = params;

  const numero = await proximoNumeroDeTicket();
  const ticketId = `TICKET-${numero}`;
  const ticketRef: DocumentReference = doc(db, TICKETS_COLLECTION, ticketId);

  const novoTicket = {
    tipo,
    resumo,
    descricao,
    prioridade,
    status: "ABERTO" as const,
    segmento,
    origem,
    solicitanteId,
    dataCriacao: serverTimestamp(),
  };

  await runTransaction(db, async (transacao) => {
    transacao.set(ticketRef, novoTicket);
  });

  return {
    id: ticketId,
    tipo,
    resumo,
    descricao,
    prioridade,
    status: "ABERTO",
    segmento,
    origem,
    solicitanteId,
    dataCriacao: null,
  };
}

/**
 * Registra a avaliação (1 a 5) dada pelo solicitante quando o ticket é
 * finalizado. Não é um comentário/atividade — é um campo direto no
 * documento do ticket, então um simples `updateDoc` resolve.
 */
export async function avaliarTicket(ticketId: string, nota: number): Promise<void> {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw new Error("A avaliação deve ser um número inteiro entre 1 e 5.");
  }

  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), { avaliacao: nota });
}

/**
 * Hook que ouve em tempo real os tickets abertos por um solicitante,
 * do mais recente para o mais antigo. Usado na tela "Lista de Solicitações".
 *
 * Tempo real aqui é intencional: se o suporte mudar o status de um ticket
 * (ex.: ABERTO → EM ANÁLISE) enquanto o usuário está com a lista aberta,
 * a badge atualiza sozinha.
 */
export function useTicketsDoSolicitante(solicitanteId: string | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!solicitanteId) {
      setTickets([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const ticketsQuery = query(
      collection(db, TICKETS_COLLECTION),
      where("solicitanteId", "==", solicitanteId),
      orderBy("dataCriacao", "desc")
    );

    const cancelarInscricao = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) =>
          converterDocParaTicket(docSnap.id, docSnap.data())
        );
        setTickets(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir tickets do solicitante:", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [solicitanteId]);

  return { tickets, carregando };
}

/**
 * Hook que ouve em tempo real um único ticket pelo id. Usado na tela de
 * detalhe — tempo real aqui também é intencional: depois que o solicitante
 * avalia (AvaliacaoCSAT chama avaliarTicket), o campo `avaliacao` chega
 * pela própria assinatura, sem precisar refazer a busca manualmente.
 */
export function useTicket(ticketId: string | null) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const cancelarInscricao = onSnapshot(
      doc(db, TICKETS_COLLECTION, ticketId),
      (snapshot) => {
        setTicket(snapshot.exists() ? converterDocParaTicket(snapshot.id, snapshot.data()) : null);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir ticket:", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [ticketId]);

  return { ticket, carregando };
}

// ---------------------------------------------------------------------------
// Backoffice (/admin)
// ---------------------------------------------------------------------------

/**
 * Hook pra fila de atendimento do backoffice — lista tickets em tempo real
 * pra quem trabalha na escola (não pra quem abriu o chamado).
 *
 * Recebe `role` como parâmetro em vez de chamar `useAuth()` aqui dentro,
 * pra manter esse módulo desacoplado do AuthContext — mesmo padrão já usado
 * em `useTicketsDoSolicitante`, que recebe o uid como parâmetro em vez de
 * resolvê-lo sozinho.
 *
 * Regra atual: `"direcao"` vê todos os tickets. Qualquer outro setor
 * (financeiro, secretaria, coordenações) também vê todos por enquanto — o
 * `Ticket` ainda não tem um campo que amarre o chamado a um setor da escola
 * (só tem `segmento`, que é do ALUNO, não de quem deve atender). Filtrar por
 * setor do funcionário fica preparado pra uma próxima sprint, quando esse
 * campo existir.
 */
export function useTicketsAdmin(role: UserRole | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Sem role = ninguém logado ainda, ou é um "pai" (RequireStaff já
    // bloqueia esse caso antes de chegar aqui, mas o hook fica seguro sozinho).
    if (!role || role === "pai") {
      setTickets([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    // TODO(sprint futura): quando role !== "direcao", filtrar
    // `where("setorResponsavel", "==", <setor do funcionário>)` assim que o
    // Ticket ganhar esse campo. Por ora, todo funcionário vê a fila inteira.
    const ticketsQuery = query(
      collection(db, TICKETS_COLLECTION),
      orderBy("dataCriacao", "desc")
    );

    const cancelarInscricao = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) =>
          converterDocParaTicket(docSnap.id, docSnap.data())
        );
        setTickets(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir tickets (admin):", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [role]);

  return { tickets, carregando };
}

/** Atualiza só o status do ticket — usado pelo <select> da fila de atendimento. */
export async function atualizarStatusTicket(
  ticketId: string,
  novoStatus: TicketStatus
): Promise<void> {
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), { status: novoStatus });
}

/**
 * Atualiza a prioridade do ticket manualmente pelo backoffice.
 *
 * Nota: uso o `TicketPrioridade` que já existe no sistema ("Baixa" | "Normal"
 * | "Alta") em vez de introduzir "BAIXA"/"MEDIA"/"ALTA" — esse tipo já é
 * consumido pelo motor de análise (`calcularPrioridade`), pelo `PriorityBadge`
 * e pelo `TicketForm` desde a Sprint 1. Usar valores diferentes aqui quebraria
 * a badge e a comparação de tipos em todo o resto do app.
 */
export async function atualizarPrioridadeTicket(
  ticketId: string,
  novaPrioridade: TicketPrioridade
): Promise<void> {
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), { prioridade: novaPrioridade });
}

// ---------------------------------------------------------------------------
// Chat bilateral (tickets/{ticketId}/mensagens)
// ---------------------------------------------------------------------------

function converterDocParaMensagem(
  id: string,
  dado: Record<string, unknown>
): MensagemTicket {
  const dataCriacao = dado.dataCriacao as Timestamp | null;
  return {
    id,
    texto: dado.texto as string,
    remetenteId: dado.remetenteId as string,
    isFuncionario: Boolean(dado.isFuncionario),
    dataCriacao: dataCriacao ? dataCriacao.toMillis() : null,
  };
}

/**
 * Envia uma mensagem no chat do ticket. `isFuncionario` decide o lado da
 * bolha nas telas — `true` quando quem envia é alguém do backoffice,
 * `false` quando é o responsável que abriu o chamado.
 */
export async function enviarMensagemTicket(
  ticketId: string,
  texto: string,
  remetenteId: string,
  isFuncionario: boolean
): Promise<void> {
  await addDoc(collection(db, TICKETS_COLLECTION, ticketId, "mensagens"), {
    texto,
    remetenteId,
    isFuncionario,
    dataCriacao: serverTimestamp(),
  });
}

/**
 * Hook que ouve em tempo real as mensagens de um ticket, em ordem
 * cronológica. Usado tanto na tela de chat do admin quanto na do pai —
 * a mesma subcoleção alimenta as duas telas.
 */
export function useMensagensTicket(ticketId: string) {
  const [mensagens, setMensagens] = useState<MensagemTicket[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      setMensagens([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const mensagensQuery = query(
      collection(db, TICKETS_COLLECTION, ticketId, "mensagens"),
      orderBy("dataCriacao", "asc")
    );

    const cancelarInscricao = onSnapshot(
      mensagensQuery,
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) =>
          converterDocParaMensagem(docSnap.id, docSnap.data())
        );
        setMensagens(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir mensagens do ticket:", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [ticketId]);

  return { mensagens, carregando };
}
