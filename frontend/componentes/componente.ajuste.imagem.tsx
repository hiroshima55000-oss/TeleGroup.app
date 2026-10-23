import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Upload,
  Move,
} from "lucide-react";

export interface ComponenteAjusteImagemProps {
  imagemOriginal: string;
  isOpen: boolean;
  onSalvar: (imagemAjustadaUrl: string) => void;
  onFechar: () => void;
  tituloExemplo?: string;
  tagsExemplo?: string[];
  nichoExemplo?: string;
}

const cores = {
  fundo: "#0b1120",
  painel: "#111827",
  painelSecundario: "#172033",
  borda: "#263449",
  texto: "#f1f5f9",
  textoSecundario: "#94a3b8",
  azul: "#38bdf8",
  azulEscuro: "#0284c7",
};

const estilos = {
  botao: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${cores.borda}`,
    background: cores.painelSecundario,
    color: cores.texto,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  } as React.CSSProperties,

  botaoIcone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 10,
    border: `1px solid ${cores.borda}`,
    background: cores.painelSecundario,
    color: cores.texto,
    cursor: "pointer",
  } as React.CSSProperties,
};

export function ComponenteAjusteImagem({
  imagemOriginal,
  isOpen,
  onSalvar,
  onFechar,
}: ComponenteAjusteImagemProps) {
  const [imagem, setImagem] = useState(imagemOriginal);
  const [larguraOriginal, setLarguraOriginal] = useState(0);
  const [alturaOriginal, setAlturaOriginal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [rotacao, setRotacao] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  const imagemRef = useRef<HTMLImageElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const arrastoRef = useRef({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });

  const carregarImagem = useCallback((src: string) => {
    const img = new Image();

    img.onload = () => {
      imagemRef.current = img;
      setImagem(src);
      setLarguraOriginal(img.naturalWidth);
      setAlturaOriginal(img.naturalHeight);
    };

    img.src = src;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setZoom(1);
    setPosX(0);
    setPosY(0);
    setRotacao(0);

    carregarImagem(imagemOriginal);
  }, [isOpen, imagemOriginal, carregarImagem]);

  const trocarImagem = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        carregarImagem(reader.result);
        setZoom(1);
        setPosX(0);
        setPosY(0);
        setRotacao(0);
      }
    };

    reader.readAsDataURL(arquivo);
    event.target.value = "";
  };

  const iniciarArrasto = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();

    setArrastando(true);

    arrastoRef.current = {
      x: event.clientX,
      y: event.clientY,
      posX,
      posY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moverImagem = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!arrastando || !areaRef.current) return;

    const area = areaRef.current.getBoundingClientRect();

    const deltaX =
      ((event.clientX - arrastoRef.current.x) / area.width) * 100;

    const deltaY =
      ((event.clientY - arrastoRef.current.y) / area.height) * 100;

    setPosX(arrastoRef.current.posX + deltaX);
    setPosY(arrastoRef.current.posY + deltaY);
  };

  const finalizarArrasto = () => {
    setArrastando(false);
  };

  const handleAplicar = () => {
    const img = imagemRef.current;

    if (!img || !larguraOriginal || !alturaOriginal) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    const larguraCanvas = canvas.width;
    const alturaCanvas = canvas.height;

    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, 0, larguraCanvas, alturaCanvas);

    ctx.save();
    ctx.translate(
      larguraCanvas / 2,
      alturaCanvas / 2
    );
    ctx.rotate((rotacao * Math.PI) / 180);

    const rotacao90 = rotacao % 180 !== 0;

    const larguraImagem = rotacao90
      ? alturaOriginal
      : larguraOriginal;

    const alturaImagem = rotacao90
      ? larguraOriginal
      : alturaOriginal;

    const escalaBase = Math.min(
      larguraCanvas / larguraImagem,
      alturaCanvas / alturaImagem
    );

    const escala = escalaBase * zoom;

    const larguraDesenho = larguraOriginal * escala;
    const alturaDesenho = alturaOriginal * escala;

    ctx.translate(
      (posX / 100) * larguraCanvas,
      (posY / 100) * alturaCanvas
    );

    ctx.drawImage(
      img,
      -larguraDesenho / 2,
      -alturaDesenho / 2,
      larguraDesenho,
      alturaDesenho
    );

    ctx.restore();

    try {
      const imagemFinal = canvas.toDataURL(
        "image/jpeg",
        0.92
      );

      onSalvar(imagemFinal);
    } catch (error) {
      console.error("Erro ao exportar imagem:", error);
    }
  };

  if (!isOpen) return null;

  const imagemEstilo: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    transform: `translate(${posX}%, ${posY}%) scale(${zoom}) rotate(${rotacao}deg)`,
    transformOrigin: "center center",
    userSelect: "none",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(2, 6, 23, 0.88)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 850,
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: `1px solid ${cores.borda}`,
          borderRadius: 18,
          background: cores.fundo,
          color: cores.texto,
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 20px",
            borderBottom: `1px solid ${cores.borda}`,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: cores.texto,
                }}
              >
                Ajustar Enquadramento para a Pesquisa
              </h2>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "rgba(56,189,248,0.14)",
                  border: "1px solid rgba(56,189,248,0.30)",
                  color: cores.azul,
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                16:9 Pesquisa
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: cores.textoSecundario,
                fontSize: 12.5,
                lineHeight: 1.4,
              }}
            >
              Defina o enquadramento (16:9) que aparecerá nos resultados da tela de pesquisa. No feed principal a imagem sempre será exibida inteira com bordas arredondadas tipo Twitter.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            style={estilos.botaoIcone}
          >
            <X size={18} />
          </button>
        </div>

        {/* Ferramentas */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            padding: "12px 20px",
            borderBottom: `1px solid ${cores.borda}`,
          }}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={estilos.botao}
          >
            <Upload size={16} />
            Trocar imagem
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={trocarImagem}
            style={{ display: "none" }}
          />
        </div>

        {/* Área da imagem */}
        <div
          style={{
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            ref={areaRef}
            onPointerDown={iniciarArrasto}
            onPointerMove={moverImagem}
            onPointerUp={finalizarArrasto}
            onPointerCancel={finalizarArrasto}
            onWheel={(event) => {
              event.preventDefault();

              setZoom((valor) =>
                Math.min(
                  3,
                  Math.max(
                    0.5,
                    valor + (event.deltaY < 0 ? 0.1 : -0.1)
                  )
                )
              );
            }}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: `1px solid ${cores.borda}`,
              borderRadius: 12,
              backgroundColor: "#080d18",
              backgroundImage:
                "linear-gradient(45deg, #111827 25%, transparent 25%), linear-gradient(-45deg, #111827 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111827 75%), linear-gradient(-45deg, transparent 75%, #111827 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition:
                "0 0, 0 10px, 10px -10px, -10px 0px",
              cursor: arrastando ? "grabbing" : "grab",
              touchAction: "none",
            }}
          >
            {imagem && (
              <img
                src={imagem}
                alt="Pré-visualização da imagem"
                draggable={false}
                style={imagemEstilo}
              />
            )}

            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(2, 6, 23, 0.82)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#38bdf8",
                fontSize: 10.5,
                fontWeight: 700,
                pointerEvents: "none",
              }}
            >
              Enquadramento Pesquisa (16:9)
            </div>

            <div
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 9px",
                borderRadius: 8,
                background: "rgba(2, 6, 23, 0.75)",
                color: "#cbd5e1",
                fontSize: 11,
                pointerEvents: "none",
              }}
            >
              <Move size={13} />
              Arraste para mover
            </div>
          </div>

          {/* Zoom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setZoom((valor) => Math.max(0.5, valor - 0.1))
              }
              aria-label="Diminuir zoom"
              style={estilos.botaoIcone}
            >
              <ZoomOut size={17} />
            </button>

            <div style={{ flex: 1 }}>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) =>
                  setZoom(Number(event.target.value))
                }
                style={{
                  width: "100%",
                  accentColor: cores.azul,
                  cursor: "pointer",
                }}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setZoom((valor) => Math.min(3, valor + 0.1))
              }
              aria-label="Aumentar zoom"
              style={estilos.botaoIcone}
            >
              <ZoomIn size={17} />
            </button>

            <span
              style={{
                minWidth: 45,
                color: cores.textoSecundario,
                fontSize: 12,
                textAlign: "right",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotação */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
              padding: 14,
              border: `1px solid ${cores.borda}`,
              borderRadius: 12,
              background: cores.painel,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Rotação
              </p>

              <p
                style={{
                  margin: "4px 0 0",
                  color: cores.textoSecundario,
                  fontSize: 12,
                }}
              >
                {rotacao}°
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() =>
                  setRotacao(
                    (valor) => (valor - 90 + 360) % 360
                  )
                }
                aria-label="Girar para a esquerda"
                style={estilos.botaoIcone}
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setRotacao((valor) => (valor + 90) % 360)
                }
                aria-label="Girar para a direita"
                style={estilos.botaoIcone}
              >
                <RotateCw size={17} />
              </button>
            </div>
          </div>

          {/* Informações */}
          <p
            style={{
              margin: "14px 0 0",
              color: cores.textoSecundario,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Imagem original: {larguraOriginal} × {alturaOriginal}px
            {" · "}
            Exportação: 1280 × 720px
          </p>
        </div>

        {/* Rodapé */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "16px 20px",
            borderTop: `1px solid ${cores.borda}`,
          }}
        >
          <button
            type="button"
            onClick={onFechar}
            style={estilos.botao}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            style={{
              ...estilos.botao,
              borderColor: cores.azul,
              background: cores.azulEscuro,
              color: "#ffffff",
              padding: "10px 18px",
            }}
          >
            <Check size={17} />
            Aplicar imagem
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComponenteAjusteImagem;