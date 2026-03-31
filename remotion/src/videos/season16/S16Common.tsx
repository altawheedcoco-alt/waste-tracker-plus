import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// Season 16: Success Stories & Environmental Impact — "Green Gold" (Green/Gold)
const PALETTE = {
  dark: { bg1: "#0a1a0d", bg2: "#142010", accent: "#22c55e", accent2: "#eab308", text: "#fff", muted: "rgba(255,255,255,0.5)" },
  light: { bg1: "#f0faf2", bg2: "#e8f8ea", accent: "#16a34a", accent2: "#ca8a04", text: "#1a2e1a", muted: "#666" },
};

export { cairo, inter, PALETTE };

export const S16Background = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const p = dark ? PALETTE.dark : PALETTE.light;
  const shift = interpolate(frame, [0, 2000], [0, 45]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${135 + shift}deg, ${p.bg1} 0%, ${p.bg2} 50%, ${p.bg1} 100%)` }}>
      {/* Rising bars */}
      {Array.from({ length: 5 }, (_, i) => {
        const h = interpolate(frame, [30 + i * 15, 80 + i * 15], [0, 100 + i * 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={i} style={{ position: "absolute", bottom: 0, left: 200 + i * 100, width: 40, height: h, background: `${i % 2 === 0 ? p.accent : p.accent2}15`, borderRadius: "8px 8px 0 0" }} />;
      })}
    </AbsoluteFill>
  );
};

export const S16Title = ({ ar, en, dark, icon }: { ar: string; en: string; dark: boolean; icon: string }) => {
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

export const S16ContentSlide = ({ items, dark }: { items: { icon: string; ar: string; en: string }[]; dark: boolean }) => {
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
