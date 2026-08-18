import { TicketPrioridade } from "@/types";

/**
 * Lista mockada de termos considerados linguagem inadequada. Em produção,
 * o ideal é trocar isso por um serviço de moderação de conteúdo (ex.: uma
 * lib mantida como `leo-profanity`/`obscenity`, ou uma API de moderação) —
 * uma lista fixa como esta é fácil de burlar (variações, leetspeak, palavras
 * novas) e não deve ser o único filtro numa aplicação real.
 */
const PALAVRAS_INADEQUADAS = [
  "idiota",
  "imbecil",
  "estupido",
  "burro",
  "otario",
  "babaca",
  "merda",
  "porra",
  "caralho",
  "desgraca",
  "puta",
  "vagabundo",
  "cretino",
];

/** Minúsculas + sem acento, pra "Estúpido" e "estupido" caírem na mesma checagem. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Checa se o texto contém alguma palavra da lista mockada.
 * Simples e propositalmente ingênuo (substring match) — suficiente para o
 * MVP, mas com falsos positivos conhecidos (ex.: uma palavra legítima que
 * contenha um dos termos como substring).
 */
export function contemLinguagemInadequada(texto: string): boolean {
  const textoNormalizado = normalizar(texto);
  return PALAVRAS_INADEQUADAS.some((palavra) => textoNormalizado.includes(palavra));
}

const TERMOS_PRIORIDADE_ALTA = ["urgente", "advogado", "procon", "fora do ar", "erro"];
const TERMOS_PRIORIDADE_NORMAL = ["boleto", "pagamento"];

/**
 * Classifica a prioridade a partir de palavras-chave no texto do chamado.
 * Ordem importa: primeiro checa os gatilhos de "Alta", depois "Normal";
 * qualquer coisa que não bater com nenhum termo cai em "Baixa".
 */
export function calcularPrioridade(texto: string): TicketPrioridade {
  const textoNormalizado = normalizar(texto);

  const éAlta = TERMOS_PRIORIDADE_ALTA.some((termo) => textoNormalizado.includes(termo));
  if (éAlta) return "Alta";

  const éNormal = TERMOS_PRIORIDADE_NORMAL.some((termo) => textoNormalizado.includes(termo));
  if (éNormal) return "Normal";

  return "Baixa";
}
