import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideoLight";

const features = [
  { icon: "🤖", ar: "ذكاء اصطناعي", en: "AI-Powered", color: "#8b5cf6" },
  { icon: "📍", ar: "تتبع GPS حي", en: "Live GPS Tracking", color: "#3b82f6" },
  { icon: "📄", ar: "فوترة إلكترونية", en: "E-Invoicing", color: "#f59e0b" },
  { icon: "📊", ar: "تحليلات ذكية", en: "Smart Analytics", color: "#22996E" },
];

export const Scene4Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp, padding: "80px 120px" }}>
      <div style={{ fontFamily: fonts.cairo, fontSize: 22, fontWeight: 700, color: "#22996E", direction: "rtl", opacity: titleSpring, letterSpacing: "0.1em", marginBottom: 12 }}>المميزات الرئيسية</div>
      <div style={{ fontFamily: fonts.cairo, fontSize: 50, fontWeight: 900, color: "#1a1a2e", direction: "rtl", opacity: titleSpring, lineHeight: 1.3, marginBottom: 60 }}>أدوات متطورة في منصة واحدة</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, direction: "rtl" }}>
        {features.map((f, i) => {
          const cardSpring = spring({ frame: frame - 30 - i * 12, fps, config: { damping: 14, stiffness: 100 } });
          const cardX = interpolate(cardSpring, [0, 1], [i % 2 === 0 ? 100 : -100, 0]);
          const glowPulse = Math.sin((frame + i * 40) * 0.05) * 0.3 + 0.7;
          return (
            <div key={i} style={{ background: "#ffffff", borderRadius: 24, padding: "36px 40px", border: `1px solid ${f.color}20`, boxShadow: `0 4px 24px ${f.color}08`, transform: `translateX(${cardX}px)`, opacity: cardSpring, display: "flex", alignItems: "center", gap: 28, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${f.color}10 0%, transparent 70%)`, opacity: glowPulse }} />
              <div style={{ width: 80, height: 80, borderRadius: 20, background: `${f.color}10`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: fonts.cairo, fontSize: 30, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>{f.ar}</div>
                <div style={{ fontFamily: fonts.inter, fontSize: 18, color: "#888", direction: "ltr" }}>{f.en}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
