import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import TelaHomeTelegram from "./telas/tela.feed";
import TelaAnunciar from "./telas/tela.criar.anuncio";
import TelaCriarCampanhaEtapa2 from "./telas/tela.criar.anuncio.et2";
import TelaCampanhas from "./telas/tela.lista.campanhas";
import TelaMinhasPublicacoes from "./telas/tela.lista.divulgacoes";
import TelaPesquisaGrupo from "./telas/tela.pesquisa";
import TelaPainel from "./telas/tela.painel";
import TelaEscolherAnuncio from "./telas/tela.selecionar";
import TelaCriarPostagem from "./telas/tela.criar.publicacao";
import TelaDashboardCampanha from "./telas/tela.metrica.campanha";
import TelaBloqueioLoginGoogle from "./telas/tela.b";
import TelaRankingTags from "./telas/tela.ranking.tags";
import TelaTeste from "./telas/tela.teste";
import TelaBanido from "./telas/tela.banido";
import TelaHistoricoInteresses from "./telas/tela.historico.interesses";

function AppRotas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TelaHomeTelegram />} />
        <Route path="/historico" element={<TelaHistoricoInteresses />} />
        <Route path="/interesses" element={<TelaHistoricoInteresses />} />
        <Route path="/meu-historico" element={<TelaHistoricoInteresses />} />
        <Route path="/lista-campanhas" element={<TelaCampanhas />} />
        <Route path="/lista-publicacoes" element={<TelaMinhasPublicacoes />} />
        <Route path="/dashboard" element={<TelaPainel />} />
        <Route path="/anunciar" element={<TelaEscolherAnuncio />} />
        <Route path="/anunciar-gratuito" element={<TelaCriarPostagem />} />
        <Route path="/anunciar-pago" element={<TelaAnunciar />} />
        <Route path="/anunciar-pago-et2" element={<TelaCriarCampanhaEtapa2 />} />
        <Route path="/anunciar-pago-etapa-2" element={<TelaCriarCampanhaEtapa2 />} />
        <Route path="/ranking-tags" element={<TelaRankingTags />} />
        <Route path="/tags" element={<TelaRankingTags />} />
        <Route path="/ranking" element={<TelaRankingTags />} />
        <Route path="/explorar-tags" element={<TelaRankingTags />} />
        <Route path="/estatisticas" element={<TelaDashboardCampanha />} />
        <Route path="/metricas" element={<TelaDashboardCampanha />} />
        <Route path="/b" element={<TelaBloqueioLoginGoogle />} />
        <Route path="/bloqueio" element={<TelaBloqueioLoginGoogle />} />
        <Route path="/login" element={<TelaBloqueioLoginGoogle />} />
        <Route path="/entrar-com-google" element={<TelaBloqueioLoginGoogle />} />
        <Route path="/aw" element={<Navigate to="/ranking-tags" replace />} />
        <Route path="/t" element={<TelaTeste />} />
        <Route path="/banido" element={<TelaBanido />} />
        <Route path="/suspenso" element={<TelaBanido />} />
        

        {/* Rotas de alias e atalhos para prevenir erros de navegação */}
        <Route path="/pesquisa" element={<TelaPesquisaGrupo />} />
        <Route path="/publicar-grupo" element={<TelaCriarPostagem />} />
        <Route path="/criar-anuncio" element={<TelaAnunciar />} />
        <Route path="/criar-anuncio-et2" element={<TelaCriarCampanhaEtapa2 />} />
        <Route path="/explorar" element={<TelaPesquisaGrupo />} />
        <Route path="/c" element={<TelaPesquisaGrupo />} />

        {/* Fallback amigável */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRotas;
