interface EmblemProps {
    size?: number;
    className?: string;
}

/**
 * Elemento-assinatura visual do sistema: o brasao institucional da
 * CIPE/Mata Atlantica, usado no login e no cabecalho do painel para
 * reforcar a identidade "sala de meios".
 */
export function Emblem({ size = 96, className }: EmblemProps) {
    return (
          <img
                  src="/emblem-cipe-mata-atlantica.png"
                  alt="Brasao CIPE/Mata Atlantica"
                  width={size}
                  height={size}
                  className={className}
                  style={{ width: size, height: size, objectFit: "contain", borderRadius: "50%" }}
                />
        );
}
