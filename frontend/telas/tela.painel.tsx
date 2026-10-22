import {
  Megaphone,
  FileText,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CabecalhoConfiguracoes from "../componentes/cabecalho.painel";
import CardPerfilUsuario from "../componentes/card.perfil.usuario";
import { InfoUsuario, obterOuCriarUsuario } from "../servicos/usuario";

function Categoria({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "12px",
          color: "#38bdf8",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {titulo}
      </h2>

      <section
        style={{
          background: "#1b222b",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        {children}
      </section>
    </div>
  );
}

function ItemConfiguracao({
  icone,
  titulo,
  descricao,
  primeiro = false,
  aoClicar,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao?: string;
  primeiro?: boolean;
  aoClicar: () => void;
}) {
  return (
    <div
      onClick={aoClicar}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        padding: "18px 21px",
        cursor: "pointer",
        borderTop: primeiro ? "none" : "1px solid rgba(255,255,255,0.07)",
        transition: "background 0.15s ease",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "rgba(34,158,217,0.10)",
          border: "1px solid rgba(34,158,217,0.15)",
        }}
      >
        {icone}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            display: "block",
            color: "#e9eef5",
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: descricao ? "3px" : "0",
          }}
        >
          {titulo}
        </strong>

        {descricao && (
          <span
            style={{
              display: "block",
              color: "#7f8c9d",
              fontSize: "13px",
              lineHeight: "1.4",
            }}
          >
            {descricao}
          </span>
        )}
      </div>

      <ChevronRight size={18} color="#657384" />
    </div>
  );
}

function TelaConfiguracoes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);

  useEffect(() => {
    const info = obterOuCriarUsuario();
    setUsuario(info);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <CabecalhoConfiguracoes />

      <main
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "42px 24px 100px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#e9eef5",
            }}
          >
            Painel da Conta
          </h1>
          <p style={{ margin: "6px 0 0", color: "#8b98a9", fontSize: "14px" }}>
            Gerencie sua identidade de usuário, suas postagens e campanhas ativas.
          </p>
        </div>

        {/* CARD DE PERFIL E IDENTIDADE DO USUÁRIO ISOLADO */}
        <CardPerfilUsuario usuario={usuario} onAtualizar={setUsuario} />

        {/* CATEGORIA: HISTÓRICO & INTERESSES */}
        <Categoria titulo="Comportamento & Interesses">
          <ItemConfiguracao
            primeiro
            icone={<Sparkles size={19} color="#38bdf8" />}
            titulo="Meu Histórico e Calculador de Interesses"
            descricao="Veja afinidades algorítmicas e tags rankeadas de ontem, 10d e 30d"
            aoClicar={() => navigate("/historico")}
          />

          <ItemConfiguracao
            icone={<Layers size={19} color="#38bdf8" />}
            titulo="Meus Conteúdos Interagidos"
            descricao="Acesse publicações organizadas em abas: vistos, likes e cliques"
            aoClicar={() => navigate("/conteudos")}
          />
        </Categoria>

        {/* CATEGORIA: GERENCIAR CONTEÚDO */}
        <Categoria titulo="Conteúdo e Publicações">
          <ItemConfiguracao
            primeiro
            icone={<Megaphone size={19} color="#38bdf8" />}
            titulo="Meus Anúncios"
            aoClicar={() => navigate("/lista-campanhas")}
          />

          <ItemConfiguracao
            icone={<FileText size={19} color="#38bdf8" />}
            titulo="Minhas Publicações"
            aoClicar={() => navigate("/lista-publicacoes")}
          />
        </Categoria>
      </main>
    </div>
  );
}

export default TelaConfiguracoes;

