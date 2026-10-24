import React, { useRef, useState, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  Link as LinkIcon,
  SlidersHorizontal,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";

import { ComponenteAjusteImagem } from "./componente.ajuste.imagem";
import { converterArquivoParaBase64 } from "../servicos/api.publicacoes";

export interface CardCriarCampConteudoProps {
  texto: string;
  setTexto: (texto: string) => void;
  foto: string;
  setFoto: (foto: string) => void;
  link: string;
  setLink: (link: string) => void;
  placeholderLink?: string;
  semTituloInterno?: boolean;
}

export function CardCriarCampConteudo({
  texto,
  setTexto,
  foto,
  setFoto,
  link,
  setLink,
  placeholderLink = "https://t.me/seugrupo ou https://seusite.com",
  semTituloInterno = false,
}: CardCriarCampConteudoProps) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);

  // Captura automática de imagens coladas da área de transferência (Ctrl+V / Cmd+V)
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const itens = event.clipboardData?.items;
      if (!itens || itens.length === 0) return;

      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        if (item.type.startsWith("image/")) {
          const arquivo = item.getAsFile();
          if (arquivo) {
            event.preventDefault();
            const leitor = new FileReader();
            leitor.onload = () => {
              if (typeof leitor.result === "string") {
                setFoto(leitor.result);
              }
            };
            leitor.readAsDataURL(arquivo);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setFoto]);

  async function colarDaAreaTransferencia() {
    try {
      if (navigator.clipboard?.read) {
        const itens = await navigator.clipboard.read();
        for (const item of itens) {
          for (const tipo of item.types) {
            if (tipo.startsWith("image/")) {
              const blob = await item.getType(tipo);
              const leitor = new FileReader();
              leitor.onload = () => {
                if (typeof leitor.result === "string") {
                  setFoto(leitor.result);
                }
              };
              leitor.readAsDataURL(blob);
              return;
            }
          }
        }
      }
      alert("Nenhuma imagem detectada. Pressione Ctrl+V no teclado para colar a imagem copiada!");
    } catch {
      alert("Pressione Ctrl+V no teclado para colar a imagem copiada diretamente aqui!");
    }
  }

  function handleSelecionarArquivo(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = e.target.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    converterArquivoParaBase64(arquivo)
      .then((base64) => setFoto(base64))
      .catch(() => {
        const leitor = new FileReader();
        leitor.onload = () => {
          if (typeof leitor.result === "string") {
            setFoto(leitor.result);
          }
        };
        leitor.readAsDataURL(arquivo);
      });
  }

  function handleRemoverFoto() {
    setFoto("");

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
  }

  return (
    <section
      style={{
        padding: "22px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(27,33,42,0.92)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {!semTituloInterno && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <FileText size={19} color="#38bdf8" />

            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Conteúdo do Anúncio
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#8b98a9",
              lineHeight: 1.5,
            }}
          >
            Preencha o texto, a foto e o link de destino do seu anúncio.
          </p>
        </div>
      )}

      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#cbd5e1",
          }}
        >
          <ImageIcon size={14} color="#38bdf8" />
          Foto do Anúncio (Opcional)
        </label>

        <input
          ref={inputArquivoRef}
          type="file"
          accept="image/*"
          onChange={handleSelecionarArquivo}
          style={{ display: "none" }}
        />

        {!foto ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              onClick={() => inputArquivoRef.current?.click()}
              style={{
                padding: "24px 18px",
                borderRadius: "14px",
                border: "2px dashed rgba(56,189,248,0.30)",
                background: "rgba(56,189,248,0.03)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  margin: "0 auto 10px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "11px",
                    background: "rgba(34,158,217,0.12)",
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
                    width: "44px",
                    height: "44px",
                    borderRadius: "11px",
                    background: "rgba(34,158,217,0.12)",
                    color: "#38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ClipboardPaste size={20} />
                </div>
              </div>

              <strong
                style={{
                  display: "block",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                Selecione nos arquivos ou cole uma imagem com Ctrl+V
              </strong>

              <span
                style={{
                  display: "block",
                  color: "#808ea3",
                  fontSize: "12px",
                }}
              >
                Tanto copiar e colar (Ctrl+V) quanto selecionar arquivos são suportados (PNG, JPG, WEBP)
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#e2e8f0",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <Upload size={14} />
                Selecionar nos Arquivos
              </button>

              <button
                type="button"
                onClick={colarDaAreaTransferencia}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  color: "#38bdf8",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <ClipboardPaste size={14} />
                Colar Imagem Copiada (Ctrl+V)
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minWidth: 0,
              }}
            >
              <img
                src={foto}
                alt="Foto selecionada"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "#4ade80",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "2px",
                  }}
                >
                  <CheckCircle2 size={14} />
                  Foto carregada com sucesso
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#808ea3",
                  }}
                >
                  No feed aparece inteira • Ajuste define a pesquisa (16:9)
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setModalAjusteAberto(true)}
                title="Ajustar enquadramento da foto para a tela de pesquisa (16:9)"
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(56,189,248,0.45)",
                  background: "rgba(56,189,248,0.15)",
                  color: "#38bdf8",
                  fontSize: "12.5px",
                  fontWeight: 750,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <SlidersHorizontal size={14} />
                Ajustar para Pesquisa (16:9)
              </button>

              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Trocar Arquivo
              </button>

              <button
                type="button"
                onClick={colarDaAreaTransferencia}
                title="Colar outra imagem da área de transferência (Ctrl+V)"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(56,189,248,0.3)",
                  background: "rgba(56,189,248,0.1)",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <ClipboardPaste size={13} />
                Colar Nova (Ctrl+V)
              </button>

              <button
                type="button"
                onClick={handleRemoverFoto}
                title="Remover foto"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {foto && (
          <div
            style={{
              marginTop: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.06)",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "11.5px",
              color: "#94a3b8",
              lineHeight: 1.45,
            }}
          >
            <Sparkles size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>No feed principal a foto aparecerá <strong>inteira</strong> com bordas arredondadas estilo Twitter. O botão <strong>Ajustar para Pesquisa</strong> serve especificamente para calibrar o corte (16:9) na tela de pesquisa.</span>
          </div>
        )}

        {modalAjusteAberto && foto && (
          <ComponenteAjusteImagem
            isOpen={modalAjusteAberto}
            imagemOriginal={foto}
            onSalvar={(novaFoto) => setFoto(novaFoto)}
            onFechar={() => setModalAjusteAberto(false)}
            tituloExemplo={texto.slice(0, 30) || "Canal Telegram"}
          />
        )}
      </div>

      <div>
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
              gap: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            <FileText size={14} color="#38bdf8" />
            Texto do Anúncio
          </label>

          <span
            style={{
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            {texto.length}/800
          </span>
        </div>

        <textarea
          id="campo-texto-campanha"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite o texto que será exibido no Feed..."
          rows={4}
          maxLength={800}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px 14px",
            borderRadius: "11px",
            border: "1px solid rgba(255,255,255,0.09)",
            outline: "none",
            background: "#151a21",
            color: "#e7edf5",
            fontSize: "14px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: "1.5",
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#cbd5e1",
          }}
        >
          <LinkIcon size={14} color="#38bdf8" />
          Link de Destino
        </label>

        <input
          id="campo-link-campanha"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={placeholderLink}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            borderRadius: "11px",
            border: "1px solid rgba(255,255,255,0.09)",
            outline: "none",
            background: "#151a21",
            color: "#e7edf5",
            fontSize: "14px",
          }}
        />
      </div>
    </section>
  );
}

export default CardCriarCampConteudo;