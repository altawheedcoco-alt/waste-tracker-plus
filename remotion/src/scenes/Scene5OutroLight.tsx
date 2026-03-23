import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideoLight";

export const Scene5Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 60, mass: 2 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);
  const ctaSpring = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [40, 0]);
  const urlSpring = spring({ frame: frame - 55, fps, config: { damping: 18 } });
  const glowScale = 1 + Math.sin(frame * 0.06) * 0.05;
  const ringRot = interpolate(frame, [0, 180], [0, 180]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,153,110,0.1) 0%, transparent 60%)", transform: `scale(${glowScale})` }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "2px solid rgba(34,153,110,0.15)", transform: `rotate(${ringRot}deg)` }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: "#22996E", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, transform: `scale(${logoScale})`, opacity: logoSpring }}>
        <div style={{ fontSize: 80, lineHeight: 1 }}>♻️</div>
        <div style={{ fontFamily: fonts.inter, fontSize: 100, fontWeight: 900, color: "#1a1a2e", letterSpacing: "-0.03em", textShadow: "0 0 100px rgba(34,153,110,0.15)" }}>
          <span style={{ color: "#22996E" }}>i</span>Recycle
        </div>
        <div style={{ fontFamily: fonts.cairo, fontSize: 42, fontWeight: 700, color: "#22996E", direction: "rtl" }}>آي ريسايكل</div>
        <div style={{ width: 200, height: 2, background: "linear-gradient(90deg, transparent, #22996E, transparent)" }} />
        <div style={{ fontFamily: fonts.cairo, fontSize: 38, fontWeight: 700, color: "#1a1a2e", opacity: ctaSpring, transform: `translateY(${ctaY}px)`, direction: "rtl" }}>ابدأ رحلتك الآن 🚀</div>
        <div style={{ fontFamily: fonts.inter, fontSize: 24, color: "#666", opacity: urlSpring, background: "rgba(34,153,110,0.06)", padding: "12px 40px", borderRadius: 50, border: "1px solid rgba(34,153,110,0.15)" }}>irecycle21.lovable.app</div>
      </div>
    </AbsoluteFill>
  );
};
