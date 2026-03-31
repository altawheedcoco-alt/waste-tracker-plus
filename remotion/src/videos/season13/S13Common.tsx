import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// Season 13: Platform Journey & History — "Warm Chronicle" theme (Amber/Navy)
const PALETTE = {
  dark: { bg1: "#0f0d1a", bg2: "#1a1428", accent: "#f59e0b", accent2: "#d97706", text: "#fff", muted: "rgba(255,255,255,0.5)" },
  light: { bg1: "#fffbf0", bg2: "#fef3e2", accent: "#d97706", accent2: "#b45309", text: "#1a1a2e", muted: "#888" },
};

export { cairo, inter, PALETTE };

export const S13Background = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const p = dark ? PALETTE.dark : PALETTE.light;
  const shift = interpolate(frame, [0, 2000], [0, 60]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${140 + shift}deg, ${p.bg1} 0%, ${p.bg2} 50%, ${p.bg1} 100%)` }}>
      {/* Timeline line */}
      <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, transparent, ${p.accent}30, transparent)` }} />
      {/* Floating dots */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = (i * 180 + 60) + Math.sin((frame + i * 40) * 0.015) * 20;
        return <div key={i} style={{ position: "absolute", left: 112, top: y, width: 20, height: 20, borderRadius: "50%", border: `2px solid ${p.accent}40`, background: `${p.accent}10` }} />;
      })}
    </AbsoluteFill>
  );
};

export const S13Title = ({ ar, en, dark, icon }: { ar: string; en: string; dark: boolean; icon: string }) => {
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

export const S13ContentSlide = ({ items, dark }: { items: { icon: string; ar: string; en: string }[]; dark: boolean }) => {
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
