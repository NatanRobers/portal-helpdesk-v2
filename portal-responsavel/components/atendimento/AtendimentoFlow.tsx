"use client";

import { useEffect, useState } from "react";
import { AtendimentoEtapa, Setor, SegmentoCoordenacao } from "@/types";
import SectorSelector from "@/components/atendimento/SectorSelector";
import SegmentoSelector from "@/components/atendimento/SegmentoSelector";
import ChatScreen from "@/components/atendimento/ChatScreen";
import { setoresInfo, segmentosInfo, mensagemBoasVindas } from "@/data/mock-data";
import { criarChat } from "@/lib/chat";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AtendimentoFlow() {
  const { user } = useAuth();
  const [etapa, setEtapa] = useState<AtendimentoEtapa>("selecao-setor");
  const [setorEscolhido, setSetorEscolhido] = useState<Setor | null>(null);
  const [segmentoEscolhido, setSegmentoEscolhido] =
    useState<SegmentoCoordenacao | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [criandoChat, setCriandoChat] = useState(false);

  // Cria o documento do chat no Firestore assim que o setor (e o segmento,
  // quando aplicável) fica definido e a etapa muda para "chat".
  useEffect(() => {
    if (etapa !== "chat" || !setorEscolhido || !user || chatId) return;

    const tituloSetor =
      setorEscolhido === "coordenacao" && segmentoEscolhido
        ? `Coordenação · ${segmentosInfo[segmentoEscolhido].label}`
        : setoresInfo[setorEscolhido].label;

    setCriandoChat(true);
    criarChat({
      responsavelId: user.uid,
      setor: setorEscolhido,
      segmento: segmentoEscolhido,
      mensagemBoasVindas: mensagemBoasVindas(tituloSetor),
    })
      .then(setChatId)
      .catch((erro) => console.error("Erro ao criar chat:", erro))
      .finally(() => setCriandoChat(false));
  }, [etapa, setorEscolhido, segmentoEscolhido, user, chatId]);

  function handleEscolherSetor(setor: Setor) {
    setSetorEscolhido(setor);
    if (setor === "coordenacao") {
      setEtapa("selecao-segmento");
    } else {
      setEtapa("chat");
    }
  }

  function handleEscolherSegmento(segmento: SegmentoCoordenacao) {
    setSegmentoEscolhido(segmento);
    setEtapa("chat");
  }

  function handleVoltar() {
    if (etapa === "chat" && setorEscolhido === "coordenacao") {
      setEtapa("selecao-segmento");
    } else {
      setEtapa("selecao-setor");
      setSetorEscolhido(null);
      setSegmentoEscolhido(null);
    }
    setChatId(null);
  }

  function handleReiniciar() {
    setEtapa("selecao-setor");
    setSetorEscolhido(null);
    setSegmentoEscolhido(null);
    setChatId(null);
  }

  if (etapa === "selecao-setor") {
    return <SectorSelector onEscolher={handleEscolherSetor} />;
  }

  if (etapa === "selecao-segmento") {
    return (
      <SegmentoSelector
        onEscolher={handleEscolherSegmento}
        onVoltar={handleVoltar}
      />
    );
  }

  if (etapa === "chat" && setorEscolhido) {
    const tituloSetor =
      setorEscolhido === "coordenacao" && segmentoEscolhido
        ? `Coordenação · ${segmentosInfo[segmentoEscolhido].label}`
        : setoresInfo[setorEscolhido].label;

    if (criandoChat || !chatId) {
      return (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="animate-spin text-navy-600" size={26} />
        </div>
      );
    }

    return (
      <ChatScreen
        chatId={chatId}
        titulo={tituloSetor}
        onVoltar={handleVoltar}
        onEncerrar={handleReiniciar}
      />
    );
  }

  return null;
}
