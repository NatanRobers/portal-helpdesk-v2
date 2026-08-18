export type Aluno = {
  nome: string;
  serie: string;
  fotoUrl: string;
  matricula: string;
};

/**
 * Perfil do usuário dentro da escola. `"pai"` é o padrão pra qualquer
 * responsável — os demais são perfis de funcionário, usados pelo Backoffice
 * (`/admin`). Fica em types (não dentro do AuthContext) porque outras partes
 * do app também precisam desse tipo (ex.: RequireStaff, Sidebar do admin).
 */
export type UserRole =
  | "pai"
  | "secretaria"
  | "direcao"
  | "coordenacao_pedagogica"
  | "coordenacao_disciplinar"
  | "financeiro";

export type Materia = {
  id: string;
  nome: string;
  notaBimestre: number;
  notaMaxima: number;
  faltas: number;
  faltasLimite: number;
};

export type EventoCalendario = {
  id: string;
  data: string; // dd/mm
  titulo: string;
  tipo: "prova" | "feriado" | "evento";
};

export type Setor = "secretaria" | "financeiro" | "coordenacao";

export type SegmentoCoordenacao =
  | "infantil"
  | "fundamental1"
  | "fundamental2";

export type Remetente = "pai" | "sistema" | "atendente" | "direcao";

/**
 * Documento em chats/{chatId}/messages/{messageId}.
 * `timestamp` fica null no instante entre o addDoc (otimista, via cache local
 * do SDK) e a confirmação do servidor preencher o serverTimestamp().
 */
export type Mensagem = {
  id: string;
  remetente: Remetente;
  texto: string;
  timestamp: number | null;
  autorId?: string;
};

/** Documento em chats/{chatId}. */
export type ChatDoc = {
  responsavelId: string;
  setor: Setor;
  segmento: SegmentoCoordenacao | null;
  escalonado: boolean;
  criadoEm: number | null;
};

export type AtendimentoEtapa = "selecao-setor" | "selecao-segmento" | "chat";

// ---------------------------------------------------------------------------
// Central de Ajuda (Ticketing) — nova modelagem
// ---------------------------------------------------------------------------

export type TicketTipo = "Incidente" | "Dúvida" | "Solicitação";

export type TicketPrioridade = "Baixa" | "Normal" | "Alta";

export type TicketStatus = "ABERTO" | "EM ANÁLISE" | "CONCLUÍDO";

/**
 * Segmento do aluno vinculado ao ticket — regra de negócio nova: todo
 * atendimento (formulário OU bot) precisa informar isso, já que o app passou
 * a rodar como WebView dentro do app principal da escola (sem contexto
 * prévio de qual aluno/segmento está solicitando).
 */
export type SegmentoAluno =
  | "Infantil"
  | "Fundamental 1"
  | "Fundamental 2"
  | "Ensino Médio";

/** De onde o ticket veio — usado para métricas e para diferenciar no detalhe. */
export type TicketOrigem = "FORMULARIO" | "BOT";

/** Documento em tickets/{ticketId}. O próprio id do documento é "TICKET-1001". */
export type Ticket = {
  id: string;
  tipo: TicketTipo;
  resumo: string;
  descricao: string;
  prioridade: TicketPrioridade;
  status: TicketStatus;
  segmento: SegmentoAluno;
  origem: TicketOrigem;
  solicitanteId: string;
  /** Nota de 1 a 5 dada pelo solicitante após o ticket ser CONCLUÍDO. */
  avaliacao?: number;
  dataCriacao: number | null;
};

export type AtividadeTipo = "comentario" | "mudanca_status";

/**
 * Documento em tickets/{ticketId}/activities/{activityId}.
 * Comentários usam `texto`; mudanças de status usam `statusAnterior`/`statusNovo`.
 * Implementado numa próxima etapa (tela de detalhe do ticket).
 */
export type Atividade = {
  id: string;
  tipo: AtividadeTipo;
  autorId: string;
  texto?: string;
  statusAnterior?: TicketStatus;
  statusNovo?: TicketStatus;
  dataCriacao: number | null;
};

/**
 * Documento em tickets/{ticketId}/mensagens/{mensagemId} — chat bilateral
 * entre o responsável e a escola dentro de um chamado. `isFuncionario`
 * decide de que lado a bolha é renderizada em cada tela (a lógica é
 * invertida entre a visão do admin e a do pai).
 */
export type MensagemTicket = {
  id: string;
  texto: string;
  remetenteId: string;
  isFuncionario: boolean;
  dataCriacao: number | null;
};

// ---------------------------------------------------------------------------
// Agendamento de Reuniões
// ---------------------------------------------------------------------------

/**
 * Setor com quem a reunião é marcada. Deliberadamente um tipo próprio (não
 * reaproveita o `Setor` do chat legado, que nem tem "direcao") — o
 * agendamento não deve ficar acoplado a uma feature que pode ser removida
 * numa sprint futura.
 */
export type SetorAgendamento = "direcao" | "secretaria" | "coordenacao" | "financeiro";

export type AgendamentoStatus = "CONFIRMADO" | "CANCELADO" | "REALIZADO";

/** Documento em agendamentos/{agendamentoId}. */
export type Agendamento = {
  id: string;
  setor: SetorAgendamento;
  /** Formato YYYY-MM-DD — string (não Timestamp) pra bater 1:1 com o <input type="date">. */
  data: string;
  /** Formato "HH:mm", ex: "14:00". */
  horario: string;
  motivo: string;
  status: AgendamentoStatus;
  solicitanteId: string;
  dataCriacao: number | null;
};

// ---------------------------------------------------------------------------
// Configuração da Agenda (Backoffice)
// ---------------------------------------------------------------------------

/**
 * Documento único em configuracoes/agenda. Controla dinamicamente o que o
 * AgendamentoForm oferece ao responsável — antes disso, dias e horários
 * eram hardcoded no componente.
 *
 * `diasDisponiveis` usa a mesma convenção do `Date.getDay()` nativo do JS:
 * 0 = Domingo, 1 = Segunda, ..., 6 = Sábado. Ex.: `[1, 2, 4, 5]` = Seg, Ter,
 * Qui, Sex habilitados (Quarta fica de fora).
 */
export type ConfiguracaoAgenda = {
  diasDisponiveis: number[];
  horariosDisponiveis: string[];
};
