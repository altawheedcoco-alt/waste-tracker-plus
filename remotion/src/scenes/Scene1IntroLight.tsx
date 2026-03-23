import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideoLight";

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ringScale = spring({ frame, fps, config: { damping: 15, stiffness: 80, mass: 2 } });
  const ringRotate = interpolate(frame, [0, 165], [0, 360]);
  const ringOpacity = interpolate(frame, [0, 20], [0, 0.2], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleAr = spring({ frame: frame - 30, fps, config: { damping: 18, stiffness: 120 } });
  const titleArY = interpolate(titleAr, [0, 1], [60, 0]);
  const titleEn = spring({ frame: frame - 45, fps, config: { damping: 18, stiffness: 120 } });
  const titleEnY = interpolate(titleEn, [0, 1], [60, 0]);
  const tagOp = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [70, 90], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [55, 85], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOp = interpolate(frame, [140, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp, justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "3px solid #22996E", opacity: ringOpacity, transform: `scale(${ringScale}) rotate(${ringRotate}deg)` }} />
      <div style={{ position: "absolute", width: 650, height: 650, borderRadius: "50%", border: "1px solid #0ea5e9", opacity: ringOpacity * 0.5, transform: `scale(${ringScale * 0.95}) rotate(${-ringRotate * 0.7}deg)` }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: `scale(${logoScale})`, opacity: logoOpacity }}>
        <div style={{ fontSize: 90, lineHeight: 1, marginBottom: 8 }}>♻️</div>
        <div style={{ fontFamily: fonts.inter, fontSize: 110, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-0.03em", transform: `translateY(${titleArY}px)`, opacity: titleAr, textShadow: "0 0 80px rgba(34,153,110,0.2)" }}>
          <span style={{ color: "#22996E" }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: fonts.cairo, fontSize: 52, fontWeight: 700, color: "#22996E", transform: `translateY(${titleEnY}px)`, opacity: titleEn, direction: "rtl" }}>آي ريسايكل</div>
        <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #22996E, transparent)", borderRadius: 2 }} />
        <div style={{ fontFamily: fonts.cairo, fontSize: 34, fontWeight: 400, color: "#555", opacity: tagOp, transform: `translateY(${tagY}px)`, direction: "rtl" }}>نحو مستقبل أنظف 🌍</div>
      </div>
    </AbsoluteFill>
  );
};
