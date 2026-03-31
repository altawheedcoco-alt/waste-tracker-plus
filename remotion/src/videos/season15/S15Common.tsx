import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// Season 15: Advanced Internal Features — "Electric Blueprint" (Blue/Silver)
const PALETTE = {
  dark: { bg1: "#070d1a", bg2: "#0d1528", accent: "#3b82f6", accent2: "#60a5fa", text: "#fff", muted: "rgba(255,255,255,0.5)" },
  light: { bg1: "#f0f4ff", bg2: "#e8eeff", accent: "#2563eb", accent2: "#1d4ed8", text: "#1a1a3e", muted: "#888" },
};

export { cairo, inter, PALETTE };

export const S15Background = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const p = dark ? PALETTE.dark : PALETTE.light;
  const shift = interpolate(frame, [0, 2000], [0, 50]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${130 + shift}deg, ${p.bg1} 0%, ${p.bg2} 50%, ${p.bg1} 100%)` }}>
      {/* Grid pattern */}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: i * 120, height: 1, background: `${p.accent}08` }} />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: i * 130, width: 1, background: `${p.accent}08` }} />
      ))}
      {/* Glowing node */}
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${p.accent}08 0%, transparent 70%)`, transform: "translate(-50%,-50%)" }} />
    </AbsoluteFill>
  );
};

export const S15Title = ({ ar, en, dark, icon }: { ar: string; en: string; dark: boolean; icon: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = dark ? PALETTE.dark : PALETTE.light;
  const s = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const y = interpolate(s, [0, 1], [80, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", transform: `translateY(${y}px)`, opacity: s }}>
        <div style={{ fontSize: 100, marginBottom: 20 }}>{icon}</div>
        <div style={{ fontFamily: cairo, fontSize: 52, fontWeight: 900, color: p.text, direction: "rtl", marginBottom: 12 }}>{ar}</div>
        <div style={{ fontFamily: inter, fontSize: 26, color: p.accent, fontWeight: 700 }}>{en}</div>
      </div>
    </AbsoluteFill>
  );
};

export const S15ContentSlide = ({ items, dark }: { items: { icon: string; ar: string; en: string }[]; dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = dark ? PALETTE.dark : PALETTE.light;
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 160px" }}>
      {items.map((item, i) => {
        const s = spring({ frame: frame - 20 - i * 12, fps, config: { damping: 15 } });
        const x = interpolate(s, [0, 1], [100, 0]);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36, transform: `translateX(${x}px)`, opacity: s, direction: "rtl" }}>
            <div style={{ fontSize: 48, minWidth: 60 }}>{item.icon}</div>
            <div>
              <div style={{ fontFamily: cairo, fontSize: 32, fontWeight: 700, color: p.text }}>{item.ar}</div>
              <div style={{ fontFamily: inter, fontSize: 18, color: p.accent, fontWeight: 600 }}>{item.en}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
