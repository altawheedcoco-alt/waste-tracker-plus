import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

// ─── Color System ───
const C = {
  bg1: "#050d08",
  bg2: "#0a1f12",
  primary: "#22996E",
  primaryLight: "#34d399",
  accent: "#0ea5e9",
  gold: "#f59e0b",
  white: "#f8fafc",
  muted: "#94a3b8",
  card: "#0f2a1a",
  cardBorder: "#1a4a2e",
};

const TRANS = 25;

// ═══════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════
export const PlatformShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const bgHue = interpolate(frame, [0, 1350], [155, 195]);
  const bgAngle = interpolate(frame, [0, 1350], [135, 165]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${bgAngle}deg, ${C.bg1} 0%, hsl(${bgHue}, 35%, 7%) 40%, ${C.bg1} 100%)`,
      fontFamily: cairo,
    }}>
      <GridOverlay frame={frame} />
      <FloatingParticles frame={frame} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene1_HeroReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene2_PlatformOnDevices />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene3_DigitalTransformation />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene4_DataAndNumbers />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene5_FleetAndOperations />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene6_Journey />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene7_Closing />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ─── Grid Overlay ───
const GridOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(Math.sin(frame * 0.008), [-1, 1], [0.02, 0.06]);
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={`h${i}`} style={{
          position: "absolute", top: i * 54, left: 0, right: 0, height: 1,
          background: C.primaryLight, opacity: 0.15,
        }} />
      ))}
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={`v${i}`} style={{
          position: "absolute", left: i * 54, top: 0, bottom: 0, width: 1,
          background: C.primaryLight, opacity: 0.1,
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ─── Floating Particles ───
const FloatingParticles: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    {Array.from({ length: 18 }, (_, i) => {
      const x = (i * 107 + 30) % 1920;
      const y = ((i * 61 + 80) % 1080) + Math.sin((frame + i * 40) * 0.018) * 35;
      const size = 2 + (i % 3) * 2;
      const op = interpolate(Math.sin((frame + i * 70) * 0.012), [-1, 1], [0.04, 0.15]);
      const color = i % 4 === 0 ? C.primary : i % 4 === 1 ? C.accent : i % 4 === 2 ? C.gold : C.primaryLight;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, opacity: op }} />;
    })}
  </AbsoluteFill>
);

// ═══════════════════════════════════════════════════════════
// SCENE 1: Hero Reveal — Logo + Platform Name
// ═══════════════════════════════════════════════════════════
const Scene1_HeroReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ringScale = spring({ frame, fps, config: { damping: 12, stiffness: 60, mass: 2 } });
  const ringRotate = interpolate(frame, [0, 210], [0, 180]);
  const logoScale = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 100 } });
  const logoGlow = interpolate(Math.sin(frame * 0.06), [-1, 1], [10, 40]);

  const titleProgress = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const subtitleOp = interpolate(frame, [60, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [60, 85], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const taglineOp = interpolate(frame, [95, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineW = interpolate(frame, [50, 90], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const exitOp = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exitOp }}>
      {/* Concentric rings */}
      {[600, 500, 400].map((size, idx) => (
        <div key={idx} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          border: `${1 + idx}px solid ${C.primary}`,
          opacity: 0.08 + idx * 0.04,
          transform: `scale(${ringScale}) rotate(${ringRotate * (idx % 2 === 0 ? 1 : -0.7)}deg)`,
        }} />
      ))}

      {/* Logo */}
      <div style={{
        transform: `scale(${logoScale})`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 30,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 ${logoGlow}px ${C.primary}, 0 20px 60px rgba(0,0,0,0.5)`,
          fontSize: 50, fontWeight: 900, color: C.white,
        }}>
          ♻️
        </div>

        <div style={{
          opacity: titleProgress, transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: C.white, letterSpacing: -2, fontFamily: inter }}>
            iRecycle
          </div>
          <div style={{
            width: lineW, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
          }} />
        </div>

        <div style={{
          opacity: subtitleOp, transform: `translateY(${subtitleY}px)`,
          fontSize: 32, fontWeight: 700, color: C.primaryLight, fontFamily: cairo,
        }}>
          منصة إدارة المخلفات الذكية
        </div>

        <div style={{
          opacity: taglineOp, fontSize: 22, color: C.muted, fontFamily: cairo,
          letterSpacing: 2,
        }}>
          نحو مستقبل رقمي أنظف
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 2: Platform on Devices — Laptop & Phone Mockups
// ═══════════════════════════════════════════════════════════
const Scene2_PlatformOnDevices: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 25], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const laptopProgress = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 80 } });
  const phoneProgress = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 90 } });

  const screenGlow = interpolate(Math.sin(frame * 0.05), [-1, 1], [5, 25]);

  const exitOp = interpolate(frame, [210, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scrolling content simulation
  const scrollY = interpolate(frame, [60, 200], [0, -300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
        opacity: titleOp, transform: `translateY(${titleY}px)`,
      }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: C.white, fontFamily: cairo }}>
          المنصة على كل أجهزتك
        </div>
        <div style={{ fontSize: 22, color: C.muted, fontFamily: cairo, marginTop: 8 }}>
          واجهة احترافية متجاوبة مع جميع الشاشات
        </div>
      </div>

      {/* Laptop Mockup */}
      <div style={{
        position: "absolute", left: 120, top: 180,
        transform: `scale(${laptopProgress}) perspective(1200px) rotateY(8deg)`,
        transformOrigin: "center center",
      }}>
        {/* Laptop screen */}
        <div style={{
          width: 800, height: 500, borderRadius: 12,
          background: "#111827",
          border: `2px solid ${C.cardBorder}`,
          overflow: "hidden", position: "relative",
          boxShadow: `0 0 ${screenGlow}px ${C.primary}40, 0 30px 80px rgba(0,0,0,0.6)`,
        }}>
          {/* Screen content — Dashboard mockup */}
          <div style={{ transform: `translateY(${scrollY}px)`, padding: 20 }}>
            {/* Top bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 16px", background: C.card, borderRadius: 8, marginBottom: 16,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.primary, fontFamily: inter }}>iRecycle Dashboard</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["🔔", "👤", "⚙️"].map((icon, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: C.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
                ))}
              </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[
                { label: "شحنات اليوم", value: "247", color: C.primary },
                { label: "إجمالي الأوزان", value: "12.5 طن", color: C.accent },
                { label: "الإيرادات", value: "₤185K", color: C.gold },
                { label: "السائقين النشطين", value: "38", color: C.primaryLight },
              ].map((stat, i) => {
                const cardOp = interpolate(frame, [40 + i * 12, 55 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={i} style={{
                    flex: 1, padding: 14, borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.card}, ${C.bg2})`,
                    border: `1px solid ${C.cardBorder}`,
                    opacity: cardOp,
                  }}>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: cairo }}>{stat.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, fontFamily: inter, marginTop: 4 }}>{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Chart area */}
            <div style={{
              height: 180, borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`,
              padding: 16, display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: cairo }}>تحليل الأداء الشهري</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flex: 1 }}>
                {[65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 92].map((h, i) => {
                  const barH = interpolate(frame, [70 + i * 5, 90 + i * 5], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <div key={i} style={{
                      flex: 1, height: barH, borderRadius: 4,
                      background: `linear-gradient(0deg, ${C.primary}80, ${C.primaryLight})`,
                    }} />
                  );
                })}
              </div>
            </div>

            {/* Table rows */}
            <div style={{ marginTop: 16 }}>
              {["SHP-2024-001 | شركة التوحيد → مصنع الحديد | 2.5 طن | مكتمل",
                "SHP-2024-002 | المنطقة الصناعية → محطة التدوير | 1.8 طن | قيد التنفيذ",
                "SHP-2024-003 | مجمع الشركات → مركز الفرز | 3.2 طن | جديد",
              ].map((row, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 6,
                  background: i % 2 === 0 ? C.card : "transparent",
                  border: `1px solid ${C.cardBorder}40`,
                  fontSize: 11, color: C.muted, fontFamily: cairo,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>{row}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Laptop base */}
        <div style={{
          width: 900, height: 18, marginLeft: -50, borderRadius: "0 0 12px 12px",
          background: "linear-gradient(180deg, #374151, #1f2937)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }} />
      </div>

      {/* Phone Mockup */}
      <div style={{
        position: "absolute", right: 160, top: 220,
        transform: `scale(${phoneProgress}) perspective(1000px) rotateY(-12deg)`,
      }}>
        <div style={{
          width: 260, height: 520, borderRadius: 28,
          background: "#111827", border: `3px solid #374151`,
          overflow: "hidden", position: "relative",
          boxShadow: `0 0 ${screenGlow * 0.8}px ${C.accent}30, 0 20px 60px rgba(0,0,0,0.5)`,
        }}>
          {/* Notch */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 100, height: 24, borderRadius: "0 0 14px 14px", background: "#000", zIndex: 10,
          }} />
          {/* Phone screen content */}
          <div style={{ padding: "36px 14px 14px", transform: `translateY(${scrollY * 0.6}px)` }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: inter,
              textAlign: "center", marginBottom: 12,
            }}>iRecycle Mobile</div>

            {/* Mini cards */}
            {[
              { icon: "📦", label: "شحناتي", val: "12" },
              { icon: "🚛", label: "تتبع مباشر", val: "3 نشط" },
              { icon: "📊", label: "تقارير", val: "8 جديد" },
            ].map((item, i) => {
              const cardOp = interpolate(frame, [55 + i * 15, 75 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: 10, borderRadius: 10, marginBottom: 8,
                  background: C.card, border: `1px solid ${C.cardBorder}`,
                  opacity: cardOp,
                }}>
                  <div style={{ fontSize: 22 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: cairo }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: inter }}>{item.val}</div>
                  </div>
                </div>
              );
            })}

            {/* Mini chart */}
            <div style={{
              marginTop: 8, padding: 10, borderRadius: 10,
              background: C.card, border: `1px solid ${C.cardBorder}`,
            }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: cairo, marginBottom: 6 }}>الأداء اليومي</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                {[40, 65, 50, 80, 55, 70, 90].map((h, i) => {
                  const barH = interpolate(frame, [80 + i * 8, 100 + i * 8], [0, h * 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return <div key={i} style={{ flex: 1, height: barH, borderRadius: 3, background: `linear-gradient(0deg, ${C.accent}80, ${C.accent})` }} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 3: Digital Transformation
// ═══════════════════════════════════════════════════════════
const Scene3_DigitalTransformation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const steps = [
    { icon: "📋", label: "من الورق", sub: "سجلات يدوية وملفات ورقية", x: 200 },
    { icon: "➡️", label: "", sub: "", x: 520 },
    { icon: "💻", label: "إلى الرقمنة", sub: "نظام متكامل وذكي", x: 840 },
    { icon: "➡️", label: "", sub: "", x: 1160 },
    { icon: "🤖", label: "إلى الذكاء", sub: "تحليل وأتمتة وتنبؤ", x: 1480 },
  ];

  const exitOp = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 80, width: "100%", textAlign: "center",
        opacity: titleOp,
      }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: C.white, fontFamily: cairo }}>
          رحلة التحول الرقمي
        </div>
        <div style={{ fontSize: 22, color: C.primaryLight, fontFamily: cairo, marginTop: 8 }}>
          من الأساليب التقليدية إلى منصة ذكية متكاملة
        </div>
      </div>

      {/* Connecting line */}
      <div style={{
        position: "absolute", top: 440, left: 250, right: 250, height: 3,
        background: `linear-gradient(90deg, ${C.primary}40, ${C.primary}, ${C.accent}, ${C.primary}, ${C.primary}40)`,
        opacity: interpolate(frame, [30, 50], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }} />

      {/* Steps */}
      {steps.map((step, i) => {
        if (!step.label) {
          const arrowOp = interpolate(frame, [35 + i * 18, 50 + i * 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const arrowX = interpolate(frame, [35 + i * 18, 55 + i * 18], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              position: "absolute", left: step.x - 30, top: 410,
              fontSize: 50, opacity: arrowOp, transform: `translateX(${arrowX}px)`,
              color: C.primaryLight,
            }}>
              ▶
            </div>
          );
        }
        const stepProgress = spring({ frame: frame - 25 - i * 18, fps, config: { damping: 14 } });
        return (
          <div key={i} style={{
            position: "absolute", left: step.x - 110, top: 280,
            width: 220, textAlign: "center",
            transform: `scale(${stepProgress}) translateY(${interpolate(stepProgress, [0, 1], [50, 0])}px)`,
          }}>
            <div style={{
              width: 100, height: 100, margin: "0 auto 16px", borderRadius: 24,
              background: `linear-gradient(135deg, ${C.card}, ${C.bg2})`,
              border: `2px solid ${C.cardBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44,
              boxShadow: `0 0 20px ${C.primary}20`,
            }}>
              {step.icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.white, fontFamily: cairo }}>{step.label}</div>
            <div style={{ fontSize: 15, color: C.muted, fontFamily: cairo, marginTop: 6 }}>{step.sub}</div>
          </div>
        );
      })}

      {/* Bottom features */}
      <div style={{ position: "absolute", bottom: 100, width: "100%", display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          "تتبع مباشر GPS",
          "فواتير إلكترونية",
          "تقارير فورية",
          "إشعارات ذكية",
          "تحليل AI",
        ].map((feat, i) => {
          const featOp = interpolate(frame, [100 + i * 12, 120 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "8px 18px", borderRadius: 20,
              background: `${C.primary}15`, border: `1px solid ${C.primary}40`,
              fontSize: 15, color: C.primaryLight, fontFamily: cairo,
              opacity: featOp,
            }}>
              ✓ {feat}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 4: Data & Numbers — Animated Statistics
// ═══════════════════════════════════════════════════════════
const Scene4_DataAndNumbers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const stats = [
    { value: "500+", label: "جهة مشتركة", icon: "🏢", color: C.primary },
    { value: "10K+", label: "شحنة شهرياً", icon: "📦", color: C.accent },
    { value: "50+", label: "شاحنة نشطة", icon: "🚛", color: C.gold },
    { value: "99.9%", label: "وقت التشغيل", icon: "⚡", color: C.primaryLight },
    { value: "24/7", label: "دعم فني", icon: "🎧", color: "#a78bfa" },
    { value: "150+", label: "تقرير تلقائي", icon: "📊", color: "#f472b6" },
  ];

  const exitOp = interpolate(frame, [210, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: titleOp,
      }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: C.white, fontFamily: cairo }}>
          أرقام تتحدث عن نفسها
        </div>
      </div>

      {/* Stats grid — 2 rows × 3 */}
      <div style={{
        position: "absolute", top: 200, left: 0, right: 0,
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 30, padding: "0 120px",
      }}>
        {stats.map((stat, i) => {
          const cardProgress = spring({ frame: frame - 20 - i * 12, fps, config: { damping: 12, stiffness: 100 } });
          const counterEnd = parseFloat(stat.value.replace(/[^0-9.]/g, "")) || 0;
          const counter = interpolate(frame, [30 + i * 12, 80 + i * 12], [0, counterEnd], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          const pulse = interpolate(Math.sin(frame * 0.04 + i), [-1, 1], [0.97, 1.03]);

          return (
            <div key={i} style={{
              width: 320, padding: 30, borderRadius: 20,
              background: `linear-gradient(145deg, ${C.card}, ${C.bg2})`,
              border: `1px solid ${stat.color}30`,
              textAlign: "center",
              transform: `scale(${cardProgress * pulse})`,
              boxShadow: `0 0 30px ${stat.color}15, 0 10px 40px rgba(0,0,0,0.3)`,
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{stat.icon}</div>
              <div style={{
                fontSize: 48, fontWeight: 900, color: stat.color, fontFamily: inter,
                textShadow: `0 0 20px ${stat.color}40`,
              }}>
                {stat.value.includes("%") || stat.value.includes("/")
                  ? stat.value
                  : `${Math.floor(counter)}${stat.value.replace(/[0-9.]/g, "")}`
                }
              </div>
              <div style={{ fontSize: 18, color: C.muted, fontFamily: cairo, marginTop: 6 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 5: Fleet & Operations — Trucks + Map
// ═══════════════════════════════════════════════════════════
const Scene5_FleetAndOperations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Animated truck path
  const truckX = interpolate(frame, [30, 180], [-100, 1920], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const truckBounce = Math.sin(frame * 0.3) * 3;

  // Map dots pulsing
  const exitOp = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const mapDots = [
    { x: 600, y: 350, label: "القاهرة" },
    { x: 750, y: 450, label: "الجيزة" },
    { x: 900, y: 380, label: "العاشر" },
    { x: 1050, y: 500, label: "السويس" },
    { x: 500, y: 520, label: "الفيوم" },
    { x: 850, y: 600, label: "بني سويف" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: titleOp,
      }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: C.white, fontFamily: cairo }}>
          أسطول وعمليات على مدار الساعة
        </div>
        <div style={{ fontSize: 22, color: C.muted, fontFamily: cairo, marginTop: 8 }}>
          تتبع مباشر لجميع الشاحنات والسائقين
        </div>
      </div>

      {/* Map area */}
      <div style={{
        position: "absolute", top: 180, left: 350, width: 800, height: 500,
        borderRadius: 20, background: `linear-gradient(135deg, ${C.card}, ${C.bg2})`,
        border: `1px solid ${C.cardBorder}`,
        overflow: "hidden",
      }}>
        {/* Grid lines for map feel */}
        {Array.from({ length: 10 }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", top: i * 50, left: 0, right: 0, height: 1, background: C.primary, opacity: 0.05 }} />
            <div style={{ position: "absolute", left: i * 80, top: 0, bottom: 0, width: 1, background: C.primary, opacity: 0.05 }} />
          </React.Fragment>
        ))}

        {/* Map dots */}
        {mapDots.map((dot, i) => {
          const dotOp = interpolate(frame, [40 + i * 15, 60 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pingScale = interpolate(Math.sin(frame * 0.06 + i * 2), [-1, 1], [1, 1.8]);
          return (
            <React.Fragment key={i}>
              {/* Ping */}
              <div style={{
                position: "absolute", left: dot.x - 350 - 12, top: dot.y - 180 - 12,
                width: 24, height: 24, borderRadius: "50%",
                border: `2px solid ${C.primary}`,
                transform: `scale(${pingScale})`, opacity: dotOp * 0.3,
              }} />
              {/* Dot */}
              <div style={{
                position: "absolute", left: dot.x - 350 - 6, top: dot.y - 180 - 6,
                width: 12, height: 12, borderRadius: "50%",
                background: C.primary, opacity: dotOp,
                boxShadow: `0 0 10px ${C.primary}`,
              }} />
              {/* Label */}
              <div style={{
                position: "absolute", left: dot.x - 350 - 30, top: dot.y - 180 + 14,
                fontSize: 12, color: C.muted, fontFamily: cairo, opacity: dotOp,
                textAlign: "center", width: 60,
              }}>
                {dot.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Animated truck */}
      <div style={{
        position: "absolute", left: truckX, top: 750 + truckBounce,
        fontSize: 50, transform: "scaleX(-1)",
      }}>
        🚛
      </div>

      {/* Right panel — Live stats */}
      <div style={{
        position: "absolute", right: 60, top: 200, width: 280,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {[
          { label: "شاحنات نشطة", value: "42", icon: "🚛", color: C.primary },
          { label: "في الطريق", value: "28", icon: "🛣️", color: C.accent },
          { label: "مكتملة اليوم", value: "67", icon: "✅", color: C.primaryLight },
          { label: "متوسط الوقت", value: "45 د", icon: "⏱️", color: C.gold },
        ].map((item, i) => {
          const itemOp = interpolate(frame, [50 + i * 15, 70 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, borderRadius: 12,
              background: C.card, border: `1px solid ${C.cardBorder}`,
              opacity: itemOp,
            }}>
              <div style={{ fontSize: 28 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: cairo }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: item.color, fontFamily: inter }}>{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 6: Platform Journey Timeline
// ═══════════════════════════════════════════════════════════
const Scene6_Journey: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const milestones = [
    { year: "2023", title: "الانطلاقة", desc: "تأسيس المنصة ورقمنة أول عمليات النقل", color: C.primary },
    { year: "2024", title: "التوسع", desc: "إضافة أكثر من 500 جهة ونظام AI متقدم", color: C.accent },
    { year: "2025", title: "الريادة", desc: "أكبر منصة إدارة مخلفات ذكية في مصر", color: C.gold },
    { year: "المستقبل", title: "التوسع الإقليمي", desc: "الانطلاق نحو الشرق الأوسط وأفريقيا", color: C.primaryLight },
  ];

  const exitOp = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Timeline line progress
  const lineProgress = interpolate(frame, [20, 160], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: titleOp,
      }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: C.white, fontFamily: cairo }}>
          رحلة المنصة
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: "absolute", top: 200, left: 150, right: 150 }}>
        {/* Line */}
        <div style={{
          position: "absolute", top: 60, left: 0, height: 4, borderRadius: 2,
          width: `${lineProgress}%`,
          background: `linear-gradient(90deg, ${C.primary}, ${C.accent}, ${C.gold}, ${C.primaryLight})`,
          boxShadow: `0 0 15px ${C.primary}40`,
        }} />

        {/* Milestones */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {milestones.map((m, i) => {
            const mProgress = spring({ frame: frame - 30 - i * 25, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                width: 340, textAlign: "center",
                transform: `scale(${mProgress}) translateY(${interpolate(mProgress, [0, 1], [40, 0])}px)`,
              }}>
                {/* Dot */}
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", margin: "0 auto 20px",
                  background: m.color, boxShadow: `0 0 15px ${m.color}60`,
                  border: `3px solid ${C.bg1}`,
                }} />

                {/* Card */}
                <div style={{
                  padding: 20, borderRadius: 16,
                  background: C.card, border: `1px solid ${m.color}30`,
                }}>
                  <div style={{
                    fontSize: 28, fontWeight: 900, color: m.color, fontFamily: inter,
                    marginBottom: 8,
                  }}>
                    {m.year}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 6 }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 14, color: C.muted, fontFamily: cairo, lineHeight: 1.6 }}>
                    {m.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: "absolute", bottom: 100, width: "100%", textAlign: "center",
        opacity: interpolate(frame, [140, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 24, color: C.primaryLight, fontFamily: cairo }}>
          🌱 نبني مستقبل إدارة المخلفات في المنطقة
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════
// SCENE 7: Closing — Logo + Tagline
// ═══════════════════════════════════════════════════════════
const Scene7_Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 80 } });
  const logoGlow = interpolate(Math.sin(frame * 0.08), [-1, 1], [15, 50]);

  const titleOp = spring({ frame: frame - 25, fps, config: { damping: 15 } });
  const tagOp = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const badgesOp = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.primary}15, transparent)`,
        filter: "blur(40px)",
      }} />

      <div style={{
        transform: `scale(${logoScale})`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: 35,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 64,
          boxShadow: `0 0 ${logoGlow}px ${C.primary}, 0 20px 80px rgba(0,0,0,0.5)`,
        }}>
          ♻️
        </div>

        <div style={{
          opacity: titleOp, fontSize: 68, fontWeight: 900, color: C.white, fontFamily: inter,
          textShadow: `0 0 30px ${C.primary}40`,
        }}>
          iRecycle
        </div>

        <div style={{
          width: 400, height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
          opacity: titleOp,
        }} />

        <div style={{
          opacity: tagOp, fontSize: 30, fontWeight: 700, color: C.primaryLight, fontFamily: cairo,
        }}>
          منصة إدارة المخلفات الذكية
        </div>

        <div style={{
          opacity: tagOp, fontSize: 20, color: C.muted, fontFamily: cairo, letterSpacing: 3,
        }}>
          SMART WASTE MANAGEMENT PLATFORM
        </div>

        {/* Badges */}
        <div style={{
          display: "flex", gap: 16, marginTop: 20, opacity: badgesOp,
        }}>
          {["🌍 صديقة للبيئة", "🔒 آمنة 100%", "⚡ فائقة السرعة", "🤖 مدعومة بالذكاء"].map((badge, i) => (
            <div key={i} style={{
              padding: "8px 16px", borderRadius: 20,
              background: `${C.primary}10`, border: `1px solid ${C.primary}30`,
              fontSize: 14, color: C.primaryLight, fontFamily: cairo,
            }}>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
