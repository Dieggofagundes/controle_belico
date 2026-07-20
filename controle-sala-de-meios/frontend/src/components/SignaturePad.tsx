import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  onConfirm: (dataUrl: string) => void;
  onClear: () => void;
  confirmed: boolean;
}

/**
 * Campo de assinatura digital — permite desenhar com mouse ou toque.
 * Ao confirmar, exporta o desenho como dataURL (PNG base64) que é enviado
 * junto ao relatório.
 */
export function SignaturePad({ onConfirm, onClear, confirmed }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ece7d6";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // O canvas tem resolução interna fixa (480x140), mas é exibido em largura
    // fluida (100%). Corrigimos a escala para que o traço acompanhe o dedo/
    // cursor com precisão em qualquer tamanho de tela (celular, tablet, etc).
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    if (confirmed) return;
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || confirmed) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokes.current = true;
    setIsEmpty(false);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    setIsEmpty(true);
    onClear();
  }

  function confirm() {
    if (isEmpty) return;
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onConfirm(dataUrl);
  }

  return (
    <div className="field">
      <label>Assinatura Digital do Responsável</label>
      <div
        style={{
          border: "1px dashed var(--color-line)",
          borderRadius: "var(--radius-sm)",
          background: "rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          style={{
            width: "100%",
            height: 140,
            cursor: confirmed ? "not-allowed" : "crosshair",
            display: "block",
            touchAction: "none",
          }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {isEmpty && !confirmed && (
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 12,
              transform: "translateY(-50%)",
              color: "var(--color-text-faint)",
              fontSize: 13,
              pointerEvents: "none",
            }}
          >
            Assine aqui com o mouse ou o dedo
          </span>
        )}
        {confirmed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(92,138,92,0.08)",
              color: "var(--color-success)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.08em",
            }}
          >
            ASSINATURA CONFIRMADA
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-ghost" onClick={clear} disabled={confirmed}>
          Limpar
        </button>
        <button type="button" className="btn btn-primary" onClick={confirm} disabled={confirmed || isEmpty}>
          Confirmar Assinatura Digital
        </button>
      </div>
    </div>
  );
}
