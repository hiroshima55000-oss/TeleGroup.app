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
} from "lucide-react";
import { useState, useEffect } from "react";
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

  function selecionarImagens(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files || []);
    if (arquivos.length === 0) return;

    const espacoDisponivel = 5 - imagens.length;
    const novasImagens = arquivos
      .filter((arquivo) => arquivo.type.startsWith("image/"))
      .slice(0, espacoDisponivel);

    if (novasImagens.length === 0) return;

    const novasPrevias = novasImagens.map((arquivo) => URL.createObjectURL(arquivo));

    setImagens((anteriores) => [...anteriores, ...novasImagens]);
    setPrevias((anteriores) => [...anteriores, ...novasPrevias]);

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
                <label
                  style={{
                    height: "120px",
                    border: "1px dashed rgba(255,255,255,0.18)",
                    borderRadius: "12px",
                    background: "#151b22",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                    color: "#94a3b8",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <ImageIcon size={26} color="#38bdf8" />
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    Clique para selecionar imagens do seu dispositivo
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    PNG, JPG, WebP ou GIF
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={selecionarImagens}
                    style={{ display: "none" }}
                  />
                </label>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {previas.map((previa, index) => (
                      <div
                        key={previa}
                        style={{
                          position: "relative",
                          width: "90px",
                          height: "90px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          background: "#151b22",
                          border: "1px solid rgba(255,255,255,0.12)",
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
                            top: "5px",
                            left: "5px",
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 4px",
                            borderRadius: "5px",
                            background: "rgba(0,0,0,0.8)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 800,
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* BOTÃO AJUSTAR ENQUADRAMENTO */}
                        <button
                          type="button"
                          onClick={() => setIndiceImagemAjustando(index)}
                          title="Ajustar enquadramento da foto"
                          style={{
                            position: "absolute",
                            top: "5px",
                            left: "28px",
                            height: "18px",
                            padding: "0 5px",
                            borderRadius: "5px",
                            background: "rgba(0,0,0,0.85)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,0.4)",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "9px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <SlidersHorizontal size={10} />
                          Ajustar
                        </button>

                        {/* BOTÃO EXCLUIR */}
                        <button
                          type="button"
                          onClick={() => removerImagem(index)}
                          title="Remover imagem"
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "5px",
                            background: "rgba(220, 38, 38, 0.85)",
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

                        {/* CONTROLES DE ORDENAÇÃO */}
                        <div
                          style={{
                            position: "absolute",
                            left: "4px",
                            right: "4px",
                            bottom: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moverImagem(index, "esquerda")}
                            style={{
                              width: "22px",
                              height: "22px",
                              border: "none",
                              borderRadius: "6px",
                              background: "rgba(0,0,0,0.75)",
                              color: index === 0 ? "rgba(255,255,255,0.25)" : "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: index === 0 ? "default" : "pointer",
                            }}
                          >
                            <ArrowLeftCircle size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={index === previas.length - 1}
                            onClick={() => moverImagem(index, "direita")}
                            style={{
                              width: "22px",
                              height: "22px",
                              border: "none",
                              borderRadius: "6px",
                              background: "rgba(0,0,0,0.75)",
                              color:
                                index === previas.length - 1
                                  ? "rgba(255,255,255,0.25)"
                                  : "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: index === previas.length - 1 ? "default" : "pointer",
                            }}
                          >
                            <ArrowRightCircle size={15} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* BOTÃO ADICIONAR MAIS */}
                    {previas.length < 5 && (
                      <label
                        style={{
                          width: "90px",
                          height: "90px",
                          border: "1px dashed rgba(255,255,255,0.18)",
                          borderRadius: "12px",
                          background: "#151b22",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "11px",
                          gap: "4px",
                        }}
                      >
                        <ImageIcon size={20} color="#38bdf8" />
                        <span>+ Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={selecionarImagens}
                          style={{ display: "none" }}
                        />
                      </label>
                    )}
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
