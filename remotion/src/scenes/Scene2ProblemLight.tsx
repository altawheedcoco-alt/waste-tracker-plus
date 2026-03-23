import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideoLight";

const problems = [
  { icon: "📋", ar: "تتبع يدوي مكلف", en: "Costly manual tracking" },
  { icon: "🚛", ar: "غياب الشفافية", en: "No transparency" },
  { icon: "⚠️", ar: "مخاطر بيئية وقانونية", en: "Environmental & legal risks" },
];

export const Scene2Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const titleX = interpolate(titleSpring, [0, 1], [-200, 0]);
  const accentWidth = interpolate(frame, [15, 45], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOp = interpolate(frame, [140, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp, padding: 120 }}>
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,50,50,0.06) 0%, transparent 70%)" }} />
      <div style={{ transform: `translateX(${titleX}px)`, opacity: titleSpring, marginBottom: 20 }}>
        <div style={{ fontFamily: fonts.cairo, fontSize: 28, fontWeight: 700, color: "#dc2626", direction: "rtl", letterSpacing: "0.1em" }}>المشكلة</div>
        <div style={{ width: accentWidth, height: 3, background: "#dc2626", borderRadius: 2, marginTop: 8, marginBottom: 24 }} />
      </div>
      <div style={{ fontFamily: fonts.cairo, fontSize: 54, fontWeight: 900, color: "#1a1a2e", direction: "rtl", lineHeight: 1.3, transform: `translateX(${titleX}px)`, opacity: titleSpring, marginBottom: 60 }}>
        إدارة المخلفات التقليدية<br /><span style={{ color: "#888" }}>مكلفة وغير فعالة</span>
      </div>
      <div style={{ display: "flex", gap: 40, direction: "rtl" }}>
        {problems.map((p, i) => {
          const cardSpring = spring({ frame: frame - 40 - i * 15, fps, config: { damping: 14 } });
          const cardY = interpolate(cardSpring, [0, 1], [80, 0]);
          return (
            <div key={i} style={{ flex: 1, background: "rgba(0,0,0,0.03)", borderRadius: 24, padding: "40px 32px", border: "1px solid rgba(220,38,38,0.12)", transform: `translateY(${cardY}px)`, opacity: cardSpring, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>{p.icon}</div>
              <div style={{ fontFamily: fonts.cairo, fontSize: 28, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>{p.ar}</div>
              <div style={{ fontFamily: fonts.inter, fontSize: 18, color: "#888" }}>{p.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
