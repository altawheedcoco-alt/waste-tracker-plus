import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { fonts } from "../MainVideo";

export const Scene5Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 60, mass: 2 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);

  // CTA text
  const ctaSpring = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const ctaY = interpolate(ctaSpring, [0, 1], [40, 0]);

  // URL
  const urlSpring = spring({ frame: frame - 55, fps, config: { damping: 18 } });

  // Pulsing glow
  const glowScale = 1 + Math.sin(frame * 0.06) * 0.05;
  const glowOp = 0.15 + Math.sin(frame * 0.06) * 0.05;

  // Ring rotation
  const ringRot = interpolate(frame, [0, 180], [0, 180]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Central glow */}
      <div style={{
        position: "absolute",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,153,110,0.2) 0%, transparent 60%)",
        transform: `scale(${glowScale})`,
        opacity: glowOp + 0.1,
      }} />

      {/* Rotating ring */}
      <div style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        border: "2px solid rgba(34,153,110,0.2)",
        transform: `rotate(${ringRot}deg)`,
      }}>
        <div style={{
          position: "absolute",
          top: -5,
          left: "50%",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#22996E",
          transform: "translateX(-50%)",
        }} />
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        transform: `scale(${logoScale})`,
        opacity: logoSpring,
      }}>
        {/* Recycle symbol */}
        <div style={{ fontSize: 80, lineHeight: 1 }}>♻️</div>

        {/* iRecycle */}
        <div style={{
          fontFamily: fonts.inter,
          fontSize: 100,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          textShadow: "0 0 100px rgba(34,153,110,0.6)",
        }}>
          <span style={{ color: "#22996E" }}>i</span>Recycle
        </div>

        {/* Arabic */}
        <div style={{
          fontFamily: fonts.cairo,
          fontSize: 42,
          fontWeight: 700,
          color: "#2dd4a8",
          direction: "rtl",
        }}>
          آي ريسايكل
        </div>

        {/* Divider */}
        <div style={{
          width: 200,
          height: 2,
          background: "linear-gradient(90deg, transparent, #22996E, transparent)",
        }} />

        {/* CTA */}
        <div style={{
          fontFamily: fonts.cairo,
          fontSize: 38,
          fontWeight: 700,
          color: "#ffffff",
          opacity: ctaSpring,
          transform: `translateY(${ctaY}px)`,
          direction: "rtl",
        }}>
          ابدأ رحلتك الآن 🚀
        </div>

        {/* URL */}
        <div style={{
          fontFamily: fonts.inter,
          fontSize: 24,
          color: "rgba(255,255,255,0.5)",
          opacity: urlSpring,
          background: "rgba(255,255,255,0.05)",
          padding: "12px 40px",
          borderRadius: 50,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          irecycle21.lovable.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
