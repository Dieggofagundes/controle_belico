interface EmblemProps {
  size?: number;
  className?: string;
}

/**
 * Elemento-assinatura visual do sistema: um selo circular estilo distintivo
 * institucional, com estrela central e anel de texto — usado no login e no
 * cabeçalho do painel para reforçar a identidade "sala de meios".
 */
export function Emblem({ size = 96, className }: EmblemProps) {
  const id = "csm-emblem";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Selo Controle Sala de Meios"
    >
      <defs>
        <path
          id={`${id}-arc-top`}
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
        />
        <path
          id={`${id}-arc-bottom`}
          d="M 170 100 A 70 70 0 0 1 30 100"
          fill="none"
        />
      </defs>

      <circle cx="100" cy="100" r="96" fill="none" stroke="#c2a464" strokeWidth="1.5" opacity="0.9" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="#c2a464" strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#c2a464" strokeWidth="1" opacity="0.35" />

      <text fill="#c2a464" fontSize="10.5" letterSpacing="3" fontFamily="Oswald, sans-serif" fontWeight="600">
        <textPath href={`#${id}-arc-top`} startOffset="50%" textAnchor="middle">
          CONTROLE SALA DE MEIOS
        </textPath>
      </text>
      <text fill="#8f7a4a" fontSize="9" letterSpacing="3" fontFamily="Oswald, sans-serif">
        <textPath href={`#${id}-arc-bottom`} startOffset="50%" textAnchor="middle">
          VIGILÂNCIA · ORDEM · SERVIÇO
        </textPath>
      </text>

      {/* Estrela de cinco pontas central */}
      <g transform="translate(100,100)">
        <polygon
          points="0,-38 9,-12 36,-12 14,4 22,30 0,14 -22,30 -14,4 -36,-12 -9,-12"
          fill="#c2a464"
          opacity="0.92"
        />
        <polygon
          points="0,-38 9,-12 36,-12 14,4 22,30 0,14 -22,30 -14,4 -36,-12 -9,-12"
          fill="none"
          stroke="#10130c"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}
