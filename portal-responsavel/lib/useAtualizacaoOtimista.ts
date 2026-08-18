"use client";

import { useEffect, useState } from "react";

/**
 * Hook genérico pra um <select> (ou qualquer controle) que atualiza um campo
 * no banco de forma otimista: aplica a mudança na tela na hora e desfaz se a
 * escrita falhar. Extraído porque a Fila de Atendimento e a Agenda de
 * Reuniões do backoffice tinham exatamente essa mesma lógica duplicada —
 * só muda o tipo do valor e a função de escrita.
 */
export function useAtualizacaoOtimista<T>(
  valorAtual: T,
  atualizar: (novoValor: T) => Promise<void>
) {
  const [valor, setValor] = useState<T>(valorAtual);
  const [atualizando, setAtualizando] = useState(false);

  // Se o valor mudar por fora (chegou um snapshot novo, outro funcionário
  // editou), o controle acompanha.
  useEffect(() => {
    setValor(valorAtual);
  }, [valorAtual]);

  async function handleMudar(novoValor: T) {
    const valorAnterior = valor;
    setValor(novoValor); // otimista
    setAtualizando(true);
    try {
      await atualizar(novoValor);
    } catch (erro) {
      console.error("Erro ao atualizar:", erro);
      setValor(valorAnterior); // desfaz se a escrita falhar
    } finally {
      setAtualizando(false);
    }
  }

  return { valor, atualizando, handleMudar };
}
