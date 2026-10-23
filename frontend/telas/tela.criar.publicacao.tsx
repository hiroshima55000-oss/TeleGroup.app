import {
  Image as ImageIcon,
  Link as LinkIcon,
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRightCircle,
  Send,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  ClipboardPaste,
  Upload,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { converterArquivoParaBase64, criarPublicacao } from "../servicos/api.publicacoes";
import { estaLogadoGoogle, checarStatusBanimento } from "../servicos/usuario";
import CabecalhoCampanhaGratuita from "../componentes/cabecalho.campanha.gratuita";
import ModalSucessoPublicacao from "../componentes/modal.sucesso.publicacao";
import CardCriarCampTags from "../componentes/card.criar.camp.tags";
import ComponenteAjusteImagem from "../componentes/componente.ajuste.imagem";
import { rolarParaCampo } from "../servicos/rolagem";

function TelaCriarPostagem() {
  const navigate = useNavigate();

  // Estados dos campos
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [imagens, setImagens] = useState<File[]>([]);
  const [previas, setPrevias] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [indiceImagemAjustando, setIndiceImagemAjustando] = useState<number | null>(null);

  // Estados de controle e feedback
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [publicacaoCriadaId, setPublicacaoCriadaId] = useState<string | null>(null);

  async function salvarAjusteImagem(novaUrl: string) {
    if (indiceImagemAjustando === null) return;
    const indice = indiceImagemAjustando;
    const novasPrevias = [...previas];
    novasPrevias[indice] = novaUrl;
    setPrevias(novasPrevias);

    try {
      const res = await fetch(novaUrl);
      const blob = await res.blob();
      const nomeAntigo = imagens[indice]?.name || `imagem-${indice + 1}.jpg`;
      const novoArquivo = new File([blob], nomeAntigo, { type: "image/jpeg" });
      const novasImagens = [...imagens];
      novasImagens[indice] = novoArquivo;
      setImagens(novasImagens);
    } catch {
      // continua com previas atualizadas
    }

    setIndiceImagemAjustando(null);
  }

  // Bloqueio obrigatório: verifica banimento e login com Google
  useEffect(() => {
    async function checarPermissao() {
      const banInfo = await checarStatusBanimento();
      if (banInfo.banido) {
        navigate(
          `/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`,
          { replace: true }
        );
        return;
      }

      if (!estaLogadoGoogle()) {
        navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login", { replace: true });
      }
    }
    checarPermissao();
  }, [navigate]);

  const adicionarArquivosImagem = useCallback((novosArquivos: File[]) => {
    setImagens((anteriores) => {
      const espacoDisponivel = 5 - anteriores.length;
      if (espacoDisponivel <= 0) {
        alert("Limite de 5 fotos atingido.");
        return anteriores;
      }

      const arquivosFiltrados = novosArquivos
        .filter((arq) => arq.type.startsWith("image/"))
        .slice(0, espacoDisponivel);

      if (arquivosFiltrados.length === 0) return anteriores;

      const novasPrevias = arquivosFiltrados.map((arq) => URL.createObjectURL(arq));
      setPrevias((prevAnteriores) => [...prevAnteriores, ...novasPrevias]);
      return [...anteriores, ...arquivosFiltrados];
    });
  }, []);

  // Lógica de colar imagem (Ctrl+V ou Cmd+V) capturada da área de transferência
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const itens = event.clipboardData?.items;
      if (!itens || itens.length === 0) return;

      const arquivosColados: File[] = [];
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        if (item.type.startsWith("image/")) {
          const arquivo = item.getAsFile();
          if (arquivo) {
            arquivosColados.push(arquivo);
          }
        }
      }

      if (arquivosColados.length > 0) {
        event.preventDefault();
        adicionarArquivosImagem(arquivosColados);
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [adicionarArquivosImagem]);

  async function colarDaAreaTransferencia() {
    try {
      if (navigator.clipboard?.read) {
        const itens = await navigator.clipboard.read();
        const arquivosColados: File[] = [];
        for (const item of itens) {
          for (const tipo of item.types) {
            if (tipo.startsWith("image/")) {
              const blob = await item.getType(tipo);
              const extensao = tipo.split("/")[1]?.replace("jpeg", "jpg") || "png";
              const arquivo = new File([blob], `imagem-colada-${Date.now()}.${extensao}`, { type: tipo });
              arquivosColados.push(arquivo);
            }
          }
        }
        if (arquivosColados.length > 0) {
          adicionarArquivosImagem(arquivosColados);
          return;
        }
      }
      alert("Nenhuma imagem detectada. Pressione Ctrl+V no teclado para colar a imagem copiada!");
    } catch {
      alert("Pressione Ctrl+V no teclado para colar a imagem copiada diretamente aqui!");
    }
  }

  function selecionarImagens(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files || []);
    if (arquivos.length > 0) {
      adicionarArquivosImagem(arquivos);
    }
    event.target.value = "";
  }

  function moverImagem(indice: number, direcao: "esquerda" | "direita") {
    const novoIndice = direcao === "esquerda" ? indice - 1 : indice + 1;
    if (novoIndice < 0 || novoIndice >= imagens.length) return;

    const novasImagens = [...imagens];
    const novasPrevias = [...previas];

    const tempImg = novasImagens[indice];
    novasImagens[indice] = novasImagens[novoIndice];
    novasImagens[novoIndice] = tempImg;

    const tempPrevia = novasPrevias[indice];
    novasPrevias[indice] = novasPrevias[novoIndice];
    novasPrevias[novoIndice] = tempPrevia;

    setImagens(novasImagens);
    setPrevias(novasPrevias);
  }

  function removerImagem(indice: number) {
    URL.revokeObjectURL(previas[indice]);
    setImagens((anteriores) => anteriores.filter((_, index) => index !== indice));
    setPrevias((anteriores) => anteriores.filter((_, index) => index !== indice));
  }

  async function publicar() {
    setErro(null);

    if (!estaLogadoGoogle()) {
      setErro("Você precisa estar conectado com sua conta Google para postar.");
      navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login");
      return;
    }

    if (!texto.trim()) {
      setErro("O texto da postagem é obrigatório. Conte aos membros sobre seu canal!");
      rolarParaCampo("campo-texto-publicacao");
      return;
    }

    if (!link.trim()) {
      setErro("Insira o link de convite do Telegram (ex: https://t.me/seugrupo).");
      rolarParaCampo("campo-link-publicacao");
      return;
    }

    const linkNormalizado = link.trim();
    if (
      !linkNormalizado.startsWith("http://") &&
      !linkNormalizado.startsWith("https://") &&
      !linkNormalizado.startsWith("t.me/")
    ) {
      setErro("Link inválido. Use um formato como https://t.me/seugrupo ou https://...");
      rolarParaCampo("campo-link-publicacao");
      return;
    }

    try {
      setCarregando(true);

      // Converter imagens selecionadas para Base64 persistível
      const imagensBase64: string[] = [];
      for (const img of imagens) {
        const base64 = await converterArquivoParaBase64(img);
        imagensBase64.push(base64);
      }

      const novaPub = await criarPublicacao({
        nome: texto.trim().slice(0, 35) || "Telegram",
        categoria: "Geral",
        descricao: texto.trim(),
        link: linkNormalizado.startsWith("t.me/") ? `https://${linkNormalizado}` : linkNormalizado,
        imagens: imagensBase64,
        tags: tags,
      });

      setPublicacaoCriadaId(novaPub.id);
      setSucesso(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao publicar. Tente novamente.";
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  function resetarFormulario() {
    setTexto("");
    setLink("");
    setImagens([]);
    setPrevias([]);
    setTags([]);
    setSucesso(false);
    setErro(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* CABEÇALHO */}
      <CabecalhoCampanhaGratuita />

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          width: "100%",
          maxWidth: "680px",
          margin: "0 auto",
          padding: "36px 20px 80px",
          boxSizing: "border-box",
        }}
      >
        {/* TÍTULO E SUBTÍTULO */}
        <div style={{ marginBottom: "26px", textAlign: "center" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(34,158,217,0.12)",
              border: "1px solid rgba(34,158,217,0.25)",
              color: "#38bdf8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={22} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
            }}
          >
            Criar Postagem Gratuita
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Publique seu canal ou grupo do Telegram na comunidade instantaneamente e sem custo.
          </p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* MODAL DE SUCESSO REAL */}
        {sucesso && (
          <ModalSucessoPublicacao
            onCriarOutra={resetarFormulario}
          />
        )}

        {/* FORMULÁRIO DE PUBLICAÇÃO */}
        {!sucesso && (
          <div
            style={{
              background: "rgba(27,34,43,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            }}
          >
            {/* TEXTO / CONTEÚDO DA POSTAGEM */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#cbd5e1",
                  }}
                >
                  Texto da postagem / Descrição *
                </label>
                <span style={{ fontSize: "11px", color: "#64748b" }}>{texto.length}/800</span>
              </div>
              <textarea
                id="campo-texto-publicacao"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Descreva o conteúdo do canal, novidades, ofertas ou convite para participar..."
                rows={5}
                maxLength={800}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "11px",
                  outline: "none",
                  background: "#151b22",
                  color: "#e7edf5",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: "1.5",
                }}
              />
            </div>

            {/* 4. IMAGENS DA POSTAGEM */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#cbd5e1",
                  }}
                >
                  <ImageIcon size={15} color="#38bdf8" />
                  Imagens (opcional, até 5 fotos)
                </label>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {previas.length} de 5 selecionadas
                </span>
              </div>

              {previas.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label
                    style={{
                      padding: "24px 16px",
                      border: "2px dashed rgba(56,189,248,0.32)",
                      borderRadius: "14px",
                      background: "rgba(56,189,248,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      color: "#94a3b8",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(56,189,248,0.12)",
                          color: "#38bdf8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(56,189,248,0.12)",
                          color: "#38bdf8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ClipboardPaste size={20} />
                      </div>
                    </div>

                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#f1f5f9" }}>
                      Selecione nos arquivos ou Cole a imagem (Ctrl+V)
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#808ea3" }}>
                      Tanto copiar e colar (Ctrl+V) quanto selecionar arquivos são suportados (PNG, JPG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={selecionarImagens}
                      style={{ display: "none" }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                    <label
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Upload size={14} />
                      Selecionar nos Arquivos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={selecionarImagens}
                        style={{ display: "none" }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={colarDaAreaTransferencia}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.35)",
                        color: "#38bdf8",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ClipboardPaste size={14} />
                      Colar Imagem Copiada (Ctrl+V)
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {previas.map((previa, index) => (
                      <div
                        key={previa}
                        style={{
                          width: "140px",
                          borderRadius: "14px",
                          overflow: "hidden",
                          background: "#151b22",
                          border: "1px solid rgba(255,255,255,0.12)",
                          padding: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {/* FOTINHA DE PRÉVIA LIMPA E DESOBSTRUÍDA */}
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "95px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            background: "#0c1015",
                          }}
                        >
                          <img
                            src={previa}
                            alt={`Imagem ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />

                          {/* BADGE NÚMERO */}
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              minWidth: "20px",
                              height: "20px",
                              padding: "0 5px",
                              borderRadius: "6px",
                              background: "rgba(0,0,0,0.8)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            #{index + 1}
                          </div>

                          {/* BOTÃO EXCLUIR */}
                          <button
                            type="button"
                            onClick={() => removerImagem(index)}
                            title="Remover imagem"
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "6px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "6px",
                              background: "rgba(220, 38, 38, 0.88)",
                              color: "#ffffff",
                              border: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* BOTÃO AJUSTAR IMAGEM EM LOCAL FÁCIL E VISÍVEL ABAIXO DA FOTO */}
                        <button
                          type="button"
                          onClick={() => setIndiceImagemAjustando(index)}
                          title="Ajustar enquadramento da imagem na tela de pesquisa (16:9)"
                          style={{
                            width: "100%",
                            padding: "7px 8px",
                            borderRadius: "8px",
                            background: "rgba(56,189,248,0.12)",
                            border: "1px solid rgba(56,189,248,0.35)",
                            color: "#38bdf8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <SlidersHorizontal size={12} />
                          Ajustar p/ Pesquisa
                        </button>

                        {/* CONTROLES DE ORDENAÇÃO */}
                        {previas.length > 1 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0 2px",
                            }}
                          >
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moverImagem(index, "esquerda")}
                              title="Mover para esquerda"
                              style={{
                                width: "24px",
                                height: "24px",
                                border: "none",
                                borderRadius: "6px",
                                background: "rgba(255,255,255,0.06)",
                                color: index === 0 ? "rgba(255,255,255,0.2)" : "#cbd5e1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: index === 0 ? "default" : "pointer",
                              }}
                            >
                              <ArrowLeftCircle size={14} />
                            </button>

                            <span style={{ fontSize: "10px", color: "#64748b" }}>Ordem</span>

                            <button
                              type="button"
                              disabled={index === previas.length - 1}
                              onClick={() => moverImagem(index, "direita")}
                              title="Mover para direita"
                              style={{
                                width: "24px",
                                height: "24px",
                                border: "none",
                                borderRadius: "6px",
                                background: "rgba(255,255,255,0.06)",
                                color: index === previas.length - 1 ? "rgba(255,255,255,0.2)" : "#cbd5e1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: index === previas.length - 1 ? "default" : "pointer",
                              }}
                            >
                              <ArrowRightCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* BOTÕES ADICIONAR / COLAR MAIS */}
                    {previas.length < 5 && (
                      <div
                        style={{
                          width: "140px",
                          minHeight: "155px",
                          borderRadius: "14px",
                          background: "#151b22",
                          border: "1px dashed rgba(255,255,255,0.18)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          padding: "10px",
                          boxSizing: "border-box",
                        }}
                      >
                        <label
                          style={{
                            width: "100%",
                            padding: "8px 6px",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#cbd5e1",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <Upload size={13} color="#38bdf8" />
                          <span>+ Arquivo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={selecionarImagens}
                            style={{ display: "none" }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={colarDaAreaTransferencia}
                          style={{
                            width: "100%",
                            padding: "8px 6px",
                            borderRadius: "8px",
                            background: "rgba(56,189,248,0.12)",
                            border: "1px solid rgba(56,189,248,0.3)",
                            color: "#38bdf8",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <ClipboardPaste size={13} />
                          <span>+ Colar (Ctrl+V)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INFORMATIVO SOBRE O PAPEL DO AJUSTE */}
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(56, 189, 248, 0.06)",
                      border: "1px solid rgba(56, 189, 248, 0.20)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "12px",
                      color: "#94a3b8",
                      lineHeight: 1.5,
                    }}
                  >
                    <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong style={{ color: "#e2e8f0" }}>Visualização da foto:</strong> No feed principal a foto aparecerá <strong>inteira</strong> com bordas arredondadas estilo Twitter. O botão <strong>Ajustar p/ Pesquisa</strong> serve exclusivamente para definir o corte (16:9) que aparecerá na tela de pesquisa.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. LINK DO TELEGRAM */}
            <div style={{ marginBottom: "26px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#cbd5e1",
                }}
              >
                <LinkIcon size={15} color="#38bdf8" />
                Link de Acesso ao Telegram *
              </label>
              <input
                id="campo-link-publicacao"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://t.me/seugrupo"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "11px",
                  outline: "none",
                  background: "#151b22",
                  color: "#e7edf5",
                  fontSize: "14px",
                }}
              />
              <span
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Links do tipo t.me/... ou https://t.me/...
              </span>
            </div>

            {/* SELETOR DE TAGS E IDENTIFICAÇÃO DE NICHO */}
            <div style={{ marginBottom: "26px" }}>
              <CardCriarCampTags
                tags={tags}
                setTags={setTags}
                categoria="Geral"
                textoConteudo={texto}
              />
            </div>

            {/* BOTÃO PUBLICAR REAL */}
            <button
              type="button"
              disabled={carregando}
              onClick={publicar}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "12px",
                padding: "15px",
                background: carregando
                  ? "#168ac0"
                  : "linear-gradient(135deg, #229ed9 0%, #168ac0 100%)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 800,
                cursor: carregando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 10px 25px rgba(34,158,217,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              {carregando ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Publicando no Telegram...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Publicar Gratuitamente Agora
                </>
              )}
            </button>
          </div>
        )}

        {/* MODAL DE AJUSTE DE IMAGEM */}
        {indiceImagemAjustando !== null && previas[indiceImagemAjustando] && (
          <ComponenteAjusteImagem
            isOpen={true}
            imagemOriginal={previas[indiceImagemAjustando]}
            onSalvar={salvarAjusteImagem}
            onFechar={() => setIndiceImagemAjustando(null)}
            tituloExemplo={texto.slice(0, 30) || "Canal Telegram"}
            tagsExemplo={tags.length > 0 ? tags : ["#telegram", "#canal", "#destaque"]}
          />
        )}
      </main>
    </div>
  );
}

export default TelaCriarPostagem;
