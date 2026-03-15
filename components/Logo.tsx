import Image from "next/image";

interface LogoProps {
  /** "light" = PNG on white bg | "dark" = RED red + LIGHTAD white text (for dark backgrounds) */
  variant?: "light" | "dark";
  height?: number;
  className?: string;
}

export default function Logo({ variant = "light", height = 28, className = "" }: LogoProps) {
  if (variant === "dark") {
    // Text logo for dark/black backgrounds
    return (
      <span className={`font-black tracking-tight leading-none ${className}`}
        style={{ fontSize: height * 0.9, letterSpacing: "-0.03em" }}>
        <span style={{ color: "#CC0000" }}>RED</span>
        <span style={{ color: "#FFFFFF" }}>LIGHTAD</span>
      </span>
    );
  }

  // PNG logo for light/white backgrounds
  return (
    <Image
      src="/logo.png"
      alt="REDLIGHTAD"
      height={height}
      width={height * 5.2}   // approx aspect ratio from the logo
      style={{ height, width: "auto", objectFit: "contain" }}
      priority
      className={className}
    />
  );
}
