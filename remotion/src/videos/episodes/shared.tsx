import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, staticFile } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
export const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// ─── Dark Theme ───
export const D = {
  bg1: "#050d08", bg2: "#0a1f12",
  primary: "#22996E", primaryLight: "#34d399",
  accent: "#0ea5e9", gold: "#f59e0b",
  white: "#f8fafc", muted: "#94a3b8",
  card: "#0f2a1a", cardBorder: "#1a4a2e",
};

// ─── Light Theme ───
export const L = {
  bg1: "#f0faf5", bg2: "#e8f5ee",
  primary: "#22996E", primaryLight: "#16a34a",
  accent: "#0284c7", gold: "#d97706",
  white: "#1a1a2e", muted: "#64748b",
  card: "#ffffff", cardBorder: "#d1e7dd",
};

export type Theme = typeof D;

// ─── Logo Intro Scene ───
export const LogoIntro: React.FC<{ C: Theme; episodeNum: number; titleAr: string; titleEn: string }> = ({ C, episodeNum, titleAr, titleEn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const ringScale = spring({ frame, fps, config: { damping: 12, stiffness: 60, mass: 2 } });
  const ringRotate = interpolate(frame, [0, 180], [0, 180]);
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 100 } });
  const logoGlow = interpolate(Math.sin(frame * 0.06), [-1, 1], [10, 40]);

  const titleProgress = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const subtitleOp = interpolate(frame, [55, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [55, 80], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const epBadgeOp = interpolate(frame, [85, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [45, 80], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const exitOp = interpolate(frame, [155, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exitOp }}>
      {[600, 500, 400].map((size, idx) => (
        <div key={idx} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          border: `${1 + idx}px solid ${C.primary}`,
          opacity: 0.08 + idx * 0.04,
          transform: `scale(${ringScale}) rotate(${ringRotate * (idx % 2 === 0 ? 1 : -0.7)}deg)`,
        }} />
      ))}

      <div style={{ transform: `scale(${logoScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 130, height: 130, borderRadius: 32,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${logoGlow}px ${C.primary}, 0 20px 60px rgba(0,0,0,${isDark ? 0.5 : 0.15})`,
          fontSize: 56, fontWeight: 900, color: "#fff",
        }}>♻️</div>

        <div style={{ opacity: titleProgress, transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 78, fontWeight: 900, color: C.white, letterSpacing: -2, fontFamily: inter }}>iRecycle</div>
          <div style={{ width: lineW, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)` }} />
        </div>

        <div style={{ opacity: subtitleOp, transform: `translateY(${subtitleY}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: C.primary, fontFamily: cairo }}>{titleAr}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.muted, fontFamily: inter, letterSpacing: 1 }}>{titleEn}</div>
        </div>

        <div style={{
          opacity: epBadgeOp, padding: "8px 28px", borderRadius: 30,
          background: `${C.primary}18`, border: `2px solid ${C.primary}40`,
          fontSize: 18, fontWeight: 700, color: C.primary, fontFamily: cairo,
        }}>
          الحلقة {episodeNum} • Episode {episodeNum}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo Outro Scene ───
export const LogoOutro: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 80 } });
  const logoGlow = interpolate(Math.sin(frame * 0.08), [-1, 1], [15, 50]);
  const titleOp = spring({ frame: frame - 25, fps, config: { damping: 15 } });
  const tagOp = interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgesOp = interpolate(frame, [65, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15, transparent)`, filter: "blur(40px)" }} />

      <div style={{ transform: `scale(${logoScale})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{
          width: 150, height: 150, borderRadius: 38,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 68, boxShadow: `0 0 ${logoGlow}px ${C.primary}, 0 20px 80px rgba(0,0,0,${isDark ? 0.5 : 0.15})`,
        }}>♻️</div>

        <div style={{ opacity: titleOp, fontSize: 74, fontWeight: 900, color: C.white, fontFamily: inter, textShadow: isDark ? `0 0 30px ${C.primary}40` : "none" }}>iRecycle</div>

        <div style={{ width: 400, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`, opacity: titleOp }} />

        <div style={{ opacity: tagOp, fontSize: 32, fontWeight: 700, color: C.primary, fontFamily: cairo }}>
          منصة إدارة المخلفات الذكية
        </div>
        <div style={{ opacity: tagOp, fontSize: 20, color: C.muted, fontFamily: inter, letterSpacing: 3 }}>
          SMART WASTE MANAGEMENT PLATFORM
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16, opacity: badgesOp }}>
          {["🇪🇬 صُنع في مصر", "♻️ نحو مستقبل أنظف", "🤖 مدعوم بالذكاء الاصطناعي"].map((badge, i) => (
            <div key={i} style={{
              padding: "8px 20px", borderRadius: 20,
              background: `${C.primary}${isDark ? "15" : "10"}`, border: `1px solid ${C.primary}30`,
              fontSize: 15, color: C.primary, fontFamily: cairo,
            }}>{badge}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Bilingual Title ───
export const BiTitle: React.FC<{ ar: string; en: string; C: Theme; frame: number; fps: number; delay?: number; size?: number }> = ({ ar, en, C, frame, fps, delay = 0, size = 48 }) => {
  const progress = spring({ frame: frame - delay, fps, config: { damping: 15 } });
  const y = interpolate(progress, [0, 1], [50, 0]);
  return (
    <div style={{ opacity: progress, transform: `translateY(${y}px)`, textAlign: "center" }}>
      <div style={{ fontSize: size, fontWeight: 900, color: C.white, fontFamily: cairo, direction: "rtl", lineHeight: 1.3 }}>{ar}</div>
      <div style={{ fontSize: size * 0.5, fontWeight: 600, color: C.muted, fontFamily: inter, marginTop: 8, letterSpacing: 1 }}>{en}</div>
    </div>
  );
};

// ─── Persistent Background ───
export const GridOverlay: React.FC<{ frame: number; C: Theme }> = ({ frame, C }) => {
  const opacity = interpolate(Math.sin(frame * 0.008), [-1, 1], [0.02, 0.06]);
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", top: i * 54, left: 0, right: 0, height: 1, background: C.primaryLight, opacity: 0.15 }} />
      ))}
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={`v${i}`} style={{ position: "absolute", left: i * 54, top: 0, bottom: 0, width: 1, background: C.primaryLight, opacity: 0.1 }} />
      ))}
    </AbsoluteFill>
  );
};

export const Particles: React.FC<{ frame: number; C: Theme }> = ({ frame, C }) => (
  <AbsoluteFill>
    {Array.from({ length: 15 }, (_, i) => {
      const x = (i * 131 + 40) % 1920;
      const y = ((i * 79 + 60) % 1080) + Math.sin((frame + i * 40) * 0.018) * 35;
      const size = 2 + (i % 3) * 2;
      const op = interpolate(Math.sin((frame + i * 70) * 0.012), [-1, 1], [0.04, 0.15]);
      const colors = [C.primary, C.accent, C.gold, C.primaryLight];
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: colors[i % 4], opacity: op }} />;
    })}
  </AbsoluteFill>
);
