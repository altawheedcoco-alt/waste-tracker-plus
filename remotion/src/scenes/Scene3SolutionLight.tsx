import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideoLight";

const actors = [
  { icon: "🏭", label: "المولّد", en: "Generator" },
  { icon: "🚛", label: "الناقل", en: "Hauler" },
  { icon: "♻️", label: "المدوّر", en: "Recycler" },
];

export const Scene3Solution = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeSpring = spring({ frame: frame - 5, fps, config: { damping: 20 } });
  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const lineProgress = interpolate(frame, [80, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOp = interpolate(frame, [220, 250], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,153,110,0.08) 0%, transparent 60%)" }} />
      <div style={{ fontFamily: fonts.cairo, fontSize: 22, fontWeight: 700, color: "#22996E", background: "rgba(34,153,110,0.08)", border: "1px solid rgba(34,153,110,0.2)", padding: "8px 32px", borderRadius: 50, marginBottom: 30, transform: `scale(${badgeSpring})`, letterSpacing: "0.05em" }}>الحل ✨</div>
      <div style={{ fontFamily: fonts.cairo, fontSize: 56, fontWeight: 900, color: "#1a1a2e", direction: "rtl", textAlign: "center", lineHeight: 1.4, transform: `translateY(${titleY}px)`, opacity: titleSpring, marginBottom: 16 }}>
        منصة <span style={{ color: "#22996E" }}>SaaS</span> ذكية
      </div>
      <div style={{ fontFamily: fonts.cairo, fontSize: 34, color: "#666", direction: "rtl", textAlign: "center", transform: `translateY(${titleY}px)`, opacity: titleSpring, marginBottom: 80 }}>تربط جميع أطراف منظومة إدارة المخلفات</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {actors.map((a, i) => {
          const actorSpring = spring({ frame: frame - 60 - i * 20, fps, config: { damping: 12 } });
          const actorScale = interpolate(actorSpring, [0, 1], [0.5, 1]);
          const pulse = Math.sin((frame - 60 - i * 20) * 0.08) * 3;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 200, textAlign: "center", transform: `scale(${actorScale}) translateY(${pulse}px)`, opacity: actorSpring }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: "rgba(34,153,110,0.08)", border: "2px solid rgba(34,153,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 52 }}>{a.icon}</div>
                <div style={{ fontFamily: fonts.cairo, fontSize: 26, fontWeight: 700, color: "#1a1a2e" }}>{a.label}</div>
                <div style={{ fontFamily: fonts.inter, fontSize: 16, color: "#999", marginTop: 4 }}>{a.en}</div>
              </div>
              {i < 2 && (
                <div style={{ width: 120, height: 3, background: `linear-gradient(90deg, #22996E ${lineProgress * 100}%, transparent ${lineProgress * 100}%)`, position: "relative", margin: "0 8px", marginTop: -40 }}>
                  <div style={{ position: "absolute", right: -6, top: -5, width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "10px solid #22996E", opacity: lineProgress }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
