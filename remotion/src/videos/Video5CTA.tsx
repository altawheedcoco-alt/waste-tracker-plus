import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const stats = [
  { num: "1,653+", ar: "منشور على المنصة", icon: "📰" },
  { num: "50+", ar: "أداة ذكية متاحة", icon: "🛠️" },
  { num: "24/7", ar: "دعم فني متواصل", icon: "💬" },
  { num: "100%", ar: "حماية بيانات مشفرة", icon: "🔒" },
];

const CTAContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Recycle icon
  const iconS = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 50, mass: 2 } });
  const iconScale = interpolate(iconS, [0, 1], [0.2, 1]);
  const iconPulse = Math.sin(frame * 0.05) * 4;

  // Title
  const titleS = spring({ frame: frame - 25, fps, config: { damping: 15 } });
  const titleY = interpolate(titleS, [0, 1], [50, 0]);

  // Stats
  const statsDelay = 120;

  // CTA button
  const ctaS = spring({ frame: frame - 300, fps, config: { damping: 12 } });
  const ctaScale = interpolate(ctaS, [0, 1], [0.8, 1]);
  const ctaPulse = 1 + Math.sin((frame - 300) * 0.08) * 0.03;

  // URL
  const urlS = spring({ frame: frame - 340, fps, config: { damping: 18 } });

  // Ring
  const ringRot = interpolate(frame, [0, 900], [0, 360]);

  const bgShift = interpolate(frame, [0, 900], [0, 30]);
  const bgBase = dark
    ? `linear-gradient(${135 + bgShift}deg, #0a1a14 0%, hsl(160,40%,8%) 50%, #0d0d1e 100%)`
    : `linear-gradient(${135 + bgShift}deg, #f0faf5 0%, hsl(155,30%,96%) 50%, #f5f7fa 100%)`;

  return (
    <AbsoluteFill style={{ background: bgBase, justifyContent: "center", alignItems: "center" }}>
      {/* Floating particles */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: (i * 241 + 60) % 1920,
          top: (i * 157 + 80) % 1080 + Math.sin((frame + i * 35) * 0.018) * 35,
          width: 4, height: 4, borderRadius: "50%",
          background: dark ? "#22996E" : "#d4d4d8", opacity: 0.08,
        }} />
      ))}

      {/* Glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(34,153,110,${dark ? "0.12" : "0.06"}) 0%, transparent 60%)`,
      }} />

      {/* Rotating ring */}
      <div style={{
        position: "absolute", width: 450, height: 450, borderRadius: "50%",
        border: `2px solid rgba(34,153,110,${dark ? "0.15" : "0.1"})`,
        transform: `rotate(${ringRot}deg)`,
      }}>
        <div style={{ position: "absolute", top: -5, left: "50%", width: 10, height: 10, borderRadius: "50%", background: "#22996E", transform: "translateX(-50%)" }} />
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
        {/* Icon */}
        <div style={{ fontSize: 80, lineHeight: 1, transform: `scale(${iconScale}) translateY(${iconPulse}px)`, opacity: iconS }}>♻️</div>

        {/* Title */}
        <div style={{ fontFamily: inter, fontSize: 90, fontWeight: 900, color: dark ? "#fff" : "#1a1a2e", letterSpacing: "-0.03em", transform: `translateY(${titleY}px)`, opacity: titleS, textShadow: `0 0 80px rgba(34,153,110,${dark ? "0.4" : "0.15"})` }}>
          <span style={{ color: "#22996E" }}>i</span>Recycle
        </div>

        {/* Arabic */}
        <div style={{ fontFamily: cairo, fontSize: 36, fontWeight: 700, color: "#22996E", direction: "rtl", transform: `translateY(${titleY}px)`, opacity: titleS }}>آي ريسايكل</div>

        {/* Stats grid */}
        <div style={{ display: "flex", gap: 32, marginTop: 30, marginBottom: 30 }}>
          {stats.map((s, i) => {
            const statS = spring({ frame: frame - statsDelay - i * 15, fps, config: { damping: 14 } });
            const statY = interpolate(statS, [0, 1], [40, 0]);
            return (
              <div key={i} style={{
                textAlign: "center",
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
                borderRadius: 20, padding: "24px 28px",
                border: `1px solid ${dark ? "rgba(34,153,110,0.15)" : "rgba(34,153,110,0.1)"}`,
                boxShadow: dark ? "none" : "0 4px 20px rgba(0,0,0,0.04)",
                transform: `translateY(${statY}px)`, opacity: statS,
                minWidth: 160,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: inter, fontSize: 32, fontWeight: 900, color: "#22996E", marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontFamily: cairo, fontSize: 16, color: dark ? "rgba(255,255,255,0.5)" : "#777" }}>{s.ar}</div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{
          fontFamily: cairo, fontSize: 36, fontWeight: 900, color: "#fff",
          background: "linear-gradient(135deg, #22996E, #0ea5e9)",
          padding: "18px 60px", borderRadius: 50,
          transform: `scale(${ctaScale * ctaPulse})`, opacity: ctaS,
          boxShadow: "0 8px 30px rgba(34,153,110,0.3)",
          direction: "rtl",
        }}>
          🚀 سجّل الآن مجاناً
        </div>

        {/* URL */}
        <div style={{
          fontFamily: inter, fontSize: 22, color: dark ? "rgba(255,255,255,0.4)" : "#999",
          opacity: urlS,
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          padding: "10px 36px", borderRadius: 50,
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        }}>
          irecycle21.lovable.app
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Video5Dark = () => <CTAContent dark />;
export const Video5Light = () => <CTAContent dark={false} />;
