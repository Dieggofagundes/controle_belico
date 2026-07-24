import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
    onConfirm: (dataUrl: string) => void;
    onClear: () => void;
    confirmed: boolean;
    label?: string;
}

/**
 * Campo de assinatura digital. Permite desenhar com mouse ou toque,
 * ou anexar uma imagem de assinatura (ex.: assinatura digitalizada ou assinatura GOV.BR).
 * Ao confirmar, exporta o desenho ou a imagem como dataURL (base64) que é enviado
 * junto ao relatório.
 */
export function SignaturePad({ onConfirm, onClear, confirmed, label }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasStrokes = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [modo, setModo] = useState<"desenho" | "imagem">("desenho");
    const [previaImagem, setPreviaImagem] = useState<string | null>(null);

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
        setPreviaImagem(null);
        onClear();
  }

  function confirm() {
        if (modo === "imagem") {
                if (!previaImagem) return;
                onConfirm(previaImagem);
                return;
        }
        if (isEmpty) return;
        const dataUrl = canvasRef.current!.toDataURL("image/png");
        onConfirm(dataUrl);
  }

  function handleImagemSelecionada(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
                setPreviaImagem(reader.result as string);
                setIsEmpty(false);
        };
        reader.readAsDataURL(file);
  }

  function alternarModo(novoModo: "desenho" | "imagem") {
        if (confirmed) return;
        setModo(novoModo);
        setPreviaImagem(null);
        setIsEmpty(true);
  }

  return (
        <div className="field">
              <label>{label ? label : "Assinatura Digital do Responsável"}</label>
        
        
          {!confirmed && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                            <button type="button" className={modo === "desenho" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => alternarModo("desenho")}>
                                        Desenhar
                            </button>
                            <button type="button" className={modo === "imagem" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => alternarModo("imagem")}>
                                        Anexar imagem (ex.: assinatura GOV.BR)
                            </button>
                  </div>
        )}

                    {modo === "desenho" && (
                            <div style={{ border: "1px dashed var(--color-line)", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.25)", position: "relative" }}>
                                        <canvas ref={canvasRef} width={480} height={140} style={{ width: "100%", height: 140, cursor: confirmed ? "not-allowed" : "crosshair", display: "block", touchAction: "none" }} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
                              {isEmpty && !confirmed && (
                                          <span style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", color: "var(--color-text-faint)", fontSize: 13, pointerEvents: "none" }}>
                                                          Assine aqui com o mouse ou o dedo
                                          </span>
                                        )}
                            </div>
                          )}

                    {modo === "imagem" && (
                            <div style={{ border: "1px dashed var(--color-line)", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.25)", padding: 12, minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              {previaImagem ? (
                                          <img src={previaImagem} alt="Prévia da assinatura" style={{ maxHeight: 110, maxWidth: "100%" }} />
                                        ) : (
                                          <span style={{ color: "var(--color-text-faint)", fontSize: 13, textAlign: "center" }}>
                                                          Selecione uma imagem de assinatura (foto, digitalização ou assinatura GOV.BR)
                                          </span>
                                        )}
                              {!confirmed && <input type="file" accept="image/*" onChange={handleImagemSelecionada} />}
                            </div>
                          )}

                    {confirmed && (
                            <div style={{ marginTop: 6, padding: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(92,138,92,0.08)", color: "var(--color-success)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em" }}>
                                        ASSINATURA CONFIRMADA
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                    <button type="button" className="btn btn-ghost" onClick={clear} disabled={confirmed}>
                                                Limpar
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={confirm} disabled={confirmed || isEmpty}>
                                                Confirmar Assinatura
                                    </button>
                        </div>
                  </div>
            );
          }
          
