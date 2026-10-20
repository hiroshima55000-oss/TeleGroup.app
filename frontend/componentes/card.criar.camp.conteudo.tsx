import React, { useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  Link as LinkIcon,
  SlidersHorizontal,
} from "lucide-react";

import { ComponenteAjusteImagem } from "./componente.ajuste.imagem";

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

    const leitor = new FileReader();

    leitor.onload = () => {
      if (typeof leitor.result === "string") {
        setFoto(leitor.result);
        setModalAjusteAberto(true);
      }
    };

    leitor.readAsDataURL(arquivo);
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
          <div
            onClick={() => inputArquivoRef.current?.click()}
            style={{
              padding: "22px 18px",
              borderRadius: "12px",
              border: "2px dashed rgba(56,189,248,0.30)",
              background: "rgba(56,189,248,0.03)",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                margin: "0 auto 10px",
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

            <strong
              style={{
                display: "block",
                color: "#e2e8f0",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "3px",
              }}
            >
              Clique para selecionar uma foto
            </strong>

            <span
              style={{
                display: "block",
                color: "#808ea3",
                fontSize: "11px",
              }}
            >
              PNG, JPG, JPEG ou WEBP (até 5MB)
            </span>
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
                  Será exibida na prévia e no Feed
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
                title="Ajustar foto"
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(56,189,248,0.4)",
                  background: "rgba(56,189,248,0.14)",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <SlidersHorizontal size={13} />
                Ajustar foto
              </button>

              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                style={{
                  padding: "7px 11px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Trocar foto
              </button>

              <button
                type="button"
                onClick={handleRemoverFoto}
                title="Remover foto"
                style={{
                  width: "32px",
                  height: "32px",
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