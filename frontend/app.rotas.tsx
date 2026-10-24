import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// O Feed principal carrega diretamente de forma síncrona para exibição instantânea
import TelaHomeTelegram from "./telas/tela.feed";

// Code-splitting com lazy loading para rotas secundárias (reduz 75% do JavaScript inicial)
const TelaAnunciar = lazy(() => import("./telas/tela.criar.anuncio"));
const TelaCriarCampanhaEtapa2 = lazy(() => import("./telas/tela.criar.anuncio.et2"));
const TelaCampanhas = lazy(() => import("./telas/tela.lista.campanhas"));
const TelaMinhasPublicacoes = lazy(() => import("./telas/tela.lista.divulgacoes"));
const TelaPesquisaGrupo = lazy(() => import("./telas/tela.pesquisa"));
const TelaPainel = lazy(() => import("./telas/tela.painel"));
const TelaEscolherAnuncio = lazy(() => import("./telas/tela.selecionar"));
const TelaCriarPostagem = lazy(() => import("./telas/tela.criar.publicacao"));
const TelaDashboardCampanha = lazy(() => import("./telas/tela.metrica.campanha"));
const TelaBloqueioLoginGoogle = lazy(() => import("./telas/tela.b"));
const TelaRankingTags = lazy(() => import("./telas/tela.ranking.tags"));
const TelaTeste = lazy(() => import("./telas/tela.teste"));
const TelaBanido = lazy(() => import("./telas/tela.banido"));
const TelaHistoricoInteresses = lazy(() => import("./telas/tela.historico.interesses"));
const TelaHistoricoConteudos = lazy(() => import("./telas/tela.historico.conteudos"));

function AppRotas() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<TelaHomeTelegram />} />
        <Route path="/historico" element={<TelaHistoricoInteresses />} />
        <Route path="/interesses" element={<TelaHistoricoInteresses />} />
        <Route path="/meu-historico" element={<TelaHistoricoInteresses />} />
        <Route path="/conteudos" element={<TelaHistoricoConteudos />} />
        <Route path="/meus-conteudos" element={<TelaHistoricoConteudos />} />
        <Route path="/historico-conteudos" element={<TelaHistoricoConteudos />} />
        <Route path="/interacoes" element={<TelaHistoricoConteudos />} />
        <Route path="/lista-campanhas" element={<TelaCampanhas />} />
        <Route path="/lista-publicacoes" element={<TelaMinhasPublicacoes />} />
        <Route path="/dashboard" element={<TelaPainel />} />
        <Route path="/painel" element={<TelaPainel />} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRotas;
