"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatDoc, Mensagem, Remetente, SegmentoCoordenacao, Setor } from "@/types";

const CHATS_COLLECTION = "chats";

/**
 * Cria um novo atendimento (um documento em `chats`) e já grava a mensagem
 * de boas-vindas como primeira mensagem da conversa. Retorna o id do chat.
 */
export async function criarChat(params: {
  responsavelId: string;
  setor: Setor;
  segmento: SegmentoCoordenacao | null;
  mensagemBoasVindas: string;
}): Promise<string> {
  const { responsavelId, setor, segmento, mensagemBoasVindas } = params;

  const novoChat: Omit<ChatDoc, "criadoEm"> & { criadoEm: ReturnType<typeof serverTimestamp> } = {
    responsavelId,
    setor,
    segmento,
    escalonado: false,
    criadoEm: serverTimestamp(),
  };

  const chatRef = await addDoc(collection(db, CHATS_COLLECTION), novoChat);

  await gravarMensagem(chatRef.id, {
    remetente: "sistema",
    texto: mensagemBoasVindas,
  });

  return chatRef.id;
}

/** Grava uma mensagem em chats/{chatId}/messages. */
export async function gravarMensagem(
  chatId: string,
  params: { remetente: Remetente; texto: string; autorId?: string }
): Promise<void> {
  const { remetente, texto, autorId } = params;

  await addDoc(collection(db, CHATS_COLLECTION, chatId, "messages"), {
    remetente,
    texto,
    autorId: autorId ?? null,
    timestamp: serverTimestamp(),
  });
}

/** Envia a mensagem do responsável (pai). Atalho sobre gravarMensagem. */
export async function enviarMensagemDoPai(
  chatId: string,
  texto: string,
  autorId: string
): Promise<void> {
  await gravarMensagem(chatId, { remetente: "pai", texto, autorId });
}

/**
 * Marca o chat como escalonado para a Direção e grava a mensagem de sistema
 * correspondente. Idempotente o suficiente para o MVP: quem chama já
 * desabilita o botão no cliente após o primeiro clique.
 */
export async function encaminharChatParaDirecao(
  chatId: string,
  mensagemEscalonamento: string
): Promise<void> {
  await updateDoc(doc(db, CHATS_COLLECTION, chatId), { escalonado: true });
  await gravarMensagem(chatId, { remetente: "direcao", texto: mensagemEscalonamento });
}

/**
 * Hook que ouve em tempo real a subcoleção de mensagens de um chat,
 * já ordenada por timestamp. É isso que faz a resposta da escola aparecer
 * na tela do pai sem precisar de reload.
 */
export function useMensagensDoChat(chatId: string | null) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setMensagens([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const mensagensQuery = query(
      collection(db, CHATS_COLLECTION, chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const cancelarInscricao = onSnapshot(
      mensagensQuery,
      (snapshot) => {
        const lista: Mensagem[] = snapshot.docs.map((docSnap) => {
          const dado = docSnap.data();
          const timestamp = dado.timestamp as Timestamp | null;
          return {
            id: docSnap.id,
            remetente: dado.remetente as Remetente,
            texto: dado.texto as string,
            timestamp: timestamp ? timestamp.toMillis() : null,
            autorId: dado.autorId ?? undefined,
          };
        });
        setMensagens(lista);
        setCarregando(false);
      },
      (erro) => {
        console.error("Erro ao ouvir mensagens do chat:", erro);
        setCarregando(false);
      }
    );

    return cancelarInscricao;
  }, [chatId]);

  return { mensagens, carregando };
}
