interface LogoProps {
  /** "light" = RED red + LIGHTAD black (white/light backgrounds)
   *  "dark"  = RED red + LIGHTAD white (black/dark backgrounds) */
  variant?: "light" | "dark";
  height?: number;
  className?: string;
}

export default function Logo({ variant = "light", height = 28, className = "" }: LogoProps) {
  const lightAdColor = variant === "dark" ? "#FFFFFF" : "#000000";

  return (
    <span
      className={className}
      style={{
        fontFamily: "'Arial Black', Arial, sans-serif",
        fontWeight: 900,
        fontSize: height,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        display: "inline-block",
      }}
    >
      <span style={{ color: "#CC0000" }}>RED</span>
      <span style={{ color: lightAdColor }}>LIGHTAD</span>
    </span>
  );
}
