import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideo";

const problems = [
  { icon: "📋", ar: "تتبع يدوي مكلف", en: "Costly manual tracking" },
  { icon: "🚛", ar: "غياب الشفافية", en: "No transparency" },
  { icon: "⚠️", ar: "مخاطر بيئية وقانونية", en: "Environmental & legal risks" },
];

export const Scene2Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 15 } });
  const titleX = interpolate(titleSpring, [0, 1], [-200, 0]);

  // Red accent
  const accentWidth = interpolate(frame, [15, 45], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Exit
  const exitOp = interpolate(frame, [140, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp, padding: 120 }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(220,50,50,0.08) 0%, transparent 70%)",
      }} />

      {/* Title area */}
      <div style={{
        transform: `translateX(${titleX}px)`,
        opacity: titleSpring,
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: fonts.cairo,
          fontSize: 28,
          fontWeight: 700,
          color: "#ef4444",
          direction: "rtl",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          المشكلة
        </div>
        <div style={{ width: accentWidth, height: 3, background: "#ef4444", borderRadius: 2, marginTop: 8, marginBottom: 24 }} />
      </div>

      <div style={{
        fontFamily: fonts.cairo,
        fontSize: 54,
        fontWeight: 900,
        color: "#ffffff",
        direction: "rtl",
        lineHeight: 1.3,
        transform: `translateX(${titleX}px)`,
        opacity: titleSpring,
        marginBottom: 60,
      }}>
        إدارة المخلفات التقليدية
        <br />
        <span style={{ color: "rgba(255,255,255,0.5)" }}>مكلفة وغير فعالة</span>
      </div>

      {/* Problem cards */}
      <div style={{ display: "flex", gap: 40, direction: "rtl" }}>
        {problems.map((p, i) => {
          const cardSpring = spring({ frame: frame - 40 - i * 15, fps, config: { damping: 14 } });
          const cardY = interpolate(cardSpring, [0, 1], [80, 0]);
          return (
            <div key={i} style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 24,
              padding: "40px 32px",
              border: "1px solid rgba(239,68,68,0.15)",
              transform: `translateY(${cardY}px)`,
              opacity: cardSpring,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>{p.icon}</div>
              <div style={{
                fontFamily: fonts.cairo,
                fontSize: 28,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 8,
              }}>{p.ar}</div>
              <div style={{
                fontFamily: fonts.inter,
                fontSize: 18,
                color: "rgba(255,255,255,0.4)",
              }}>{p.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
