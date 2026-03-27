import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// ─── Color Palette ───
const COLORS = {
  bgDark: "#0a1a0f",
  bgGreen: "#0d2818",
  primary: "#22c55e",
  primaryGlow: "#4ade80",
  accent: "#10b981",
  gold: "#f59e0b",
  white: "#ffffff",
  muted: "#94a3b8",
  gradientStart: "#064e3b",
  gradientEnd: "#0a1a0f",
};

// ─── Scene 1: Logo & Company Name Reveal ───
const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const logoRotate = interpolate(frame, [0, 40], [180, 0], { extrapolateRight: "clamp" });
  const titleY = spring({ frame: frame - 20, fps, config: { damping: 15, stiffness: 100 } });
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [30, 70], [0, 400], { extrapolateRight: "clamp" });
  const particlePhase = frame * 0.03;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${COLORS.bgGreen}, ${COLORS.bgDark})`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = Math.sin(particlePhase + i * 1.2) * 300 + 540;
        const y = ((i * 137 + frame * (0.5 + i * 0.1)) % 1920) - 100;
        const size = 3 + (i % 4) * 2;
        const opacity = 0.1 + (i % 3) * 0.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: COLORS.primaryGlow,
              opacity,
            }}
          />
        );
      })}

      {/* Glowing circle behind logo */}
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}22, transparent 70%)`,
          transform: `scale(${logoScale})`,
          top: 500,
        }}
      />

      {/* Recycling icon */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
          marginBottom: 40,
        }}
      >
        <svg width="200" height="200" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={COLORS.primary} strokeWidth="2" opacity="0.3" />
          <path
            d="M50 15 L35 35 L45 35 L45 50 L55 50 L55 35 L65 35 Z"
            fill={COLORS.primaryGlow}
            transform="rotate(0, 50, 50)"
          />
          <path
            d="M50 15 L35 35 L45 35 L45 50 L55 50 L55 35 L65 35 Z"
            fill={COLORS.accent}
            transform="rotate(120, 50, 50)"
          />
          <path
            d="M50 15 L35 35 L45 35 L45 50 L55 50 L55 35 L65 35 Z"
            fill={COLORS.gold}
            transform="rotate(240, 50, 50)"
          />
          <circle cx="50" cy="50" r="12" fill={COLORS.primary} />
          <text x="50" y="55" textAnchor="middle" fill={COLORS.bgDark} fontSize="14" fontWeight="bold">♻</text>
        </svg>
      </div>

      {/* Company name */}
      <div
        style={{
          transform: `translateY(${interpolate(titleY, [0, 1], [60, 0])}px)`,
          opacity: titleY,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: COLORS.white,
            fontFamily: "sans-serif",
            letterSpacing: 2,
            textShadow: `0 0 40px ${COLORS.primary}66`,
            lineHeight: 1.3,
            direction: "rtl",
          }}
        >
          شركة التوحيد
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: COLORS.primaryGlow,
            fontFamily: "sans-serif",
            marginTop: 10,
            direction: "rtl",
          }}
        >
          للخدمات البيئية
        </div>
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
          marginTop: 30,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 30,
          fontSize: 28,
          color: COLORS.muted,
          fontFamily: "sans-serif",
          textAlign: "center",
          direction: "rtl",
          lineHeight: 1.6,
        }}
      >
        رواد إدارة المخلفات في مصر 🇪🇬
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Services ───
const Scene2_Services: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const services = [
    { icon: "🚛", title: "جمع المخلفات", desc: "جمع منظم وآمن من المصدر", color: COLORS.primary },
    { icon: "🛣️", title: "نقل آمن", desc: "أسطول حديث ومرخص", color: COLORS.accent },
    { icon: "♻️", title: "إعادة التدوير", desc: "تحويل المخلفات لموارد", color: COLORS.gold },
    { icon: "🛡️", title: "التخلص الآمن", desc: "وفق المعايير البيئية", color: "#60a5fa" },
  ];

  const titleSpring = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bgDark}, ${COLORS.bgGreen} 50%, ${COLORS.bgDark})`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        padding: 60,
      }}
    >
      {/* Section title */}
      <div
        style={{
          position: "absolute",
          top: 200,
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
          textAlign: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 24, color: COLORS.primary, fontFamily: "sans-serif", letterSpacing: 4, marginBottom: 15 }}>
          خدماتنا
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, color: COLORS.white, fontFamily: "sans-serif", direction: "rtl" }}>
          حلول بيئية متكاملة
        </div>
      </div>

      {/* Service cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 150, width: "85%" }}>
        {services.map((service, i) => {
          const delay = 15 + i * 15;
          const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
          const slideX = interpolate(cardSpring, [0, 1], [i % 2 === 0 ? -400 : 400, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: cardSpring,
                transform: `translateX(${slideX}px)`,
                background: `linear-gradient(135deg, ${service.color}15, ${service.color}08)`,
                border: `1.5px solid ${service.color}40`,
                borderRadius: 24,
                padding: "30px 35px",
                display: "flex",
                alignItems: "center",
                gap: 25,
                direction: "rtl",
              }}
            >
              <div
                style={{
                  fontSize: 50,
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: `${service.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {service.icon}
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.white, fontFamily: "sans-serif", marginBottom: 6 }}>
                  {service.title}
                </div>
                <div style={{ fontSize: 22, color: COLORS.muted, fontFamily: "sans-serif" }}>
                  {service.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Stats ───
const Scene3_Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stats = [
    { value: "+1000", label: "عميل يثق بنا", icon: "👥" },
    { value: "+50", label: "شاحنة حديثة", icon: "🚛" },
    { value: "24/7", label: "خدمة متواصلة", icon: "⏰" },
    { value: "+10", label: "سنوات خبرة", icon: "🏆" },
  ];

  const bgPulse = Math.sin(frame * 0.05) * 0.1 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${COLORS.gradientStart}, ${COLORS.bgDark})`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Pulsing bg circle */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          border: `2px solid ${COLORS.primary}15`,
          transform: `scale(${bgPulse})`,
        }}
      />

      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.white,
          fontFamily: "sans-serif",
          marginBottom: 60,
          direction: "rtl",
          textAlign: "center",
          opacity: spring({ frame, fps, config: { damping: 20 } }),
        }}
      >
        أرقامنا تتحدث 📊
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 30,
          width: "85%",
        }}
      >
        {stats.map((stat, i) => {
          const delay = 10 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 100 } });
          const scale = interpolate(s, [0, 1], [0.3, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: s,
                transform: `scale(${scale})`,
                background: `linear-gradient(145deg, ${COLORS.primary}12, ${COLORS.primary}05)`,
                border: `1px solid ${COLORS.primary}30`,
                borderRadius: 28,
                padding: 35,
                textAlign: "center",
                direction: "rtl",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 10 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: COLORS.primaryGlow,
                  fontFamily: "sans-serif",
                  textShadow: `0 0 30px ${COLORS.primary}44`,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 22, color: COLORS.muted, fontFamily: "sans-serif", marginTop: 8 }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Environmental Impact ───
const Scene4_Impact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const points = [
    "حماية البيئة المصرية 🌿",
    "الالتزام بمعايير السلامة الدولية 🌍",
    "المخلفات الغير خطرة بأمان تام 🛡️",
    "شراكات مع كبرى المؤسسات 🤝",
  ];

  const headSpring = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.bgDark}, #0b2b1a, ${COLORS.bgDark})`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        padding: 60,
      }}
    >
      {/* Decorative leaf-like shapes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 600;
        const x = Math.cos(angle + frame * 0.005) * radius + 540;
        const y = Math.sin(angle + frame * 0.005) * radius + 960;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 60,
              height: 60,
              borderRadius: "50% 0 50% 0",
              background: `${COLORS.primary}08`,
              border: `1px solid ${COLORS.primary}15`,
              transform: `rotate(${angle * 57}deg)`,
            }}
          />
        );
      })}

      <div
        style={{
          opacity: headSpring,
          transform: `scale(${interpolate(headSpring, [0, 1], [0.8, 1])})`,
          textAlign: "center",
          marginBottom: 50,
          direction: "rtl",
        }}
      >
        <div style={{ fontSize: 28, color: COLORS.accent, fontFamily: "sans-serif", letterSpacing: 3, marginBottom: 15 }}>
          التزامنا
        </div>
        <div style={{ fontSize: 50, fontWeight: 900, color: COLORS.white, fontFamily: "sans-serif", lineHeight: 1.4 }}>
          نحو بيئة أنظف
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 25, width: "90%" }}>
        {points.map((point, i) => {
          const delay = 20 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          return (
            <div
              key={i}
              style={{
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [200, 0])}px)`,
                background: `${COLORS.primary}0a`,
                border: `1px solid ${COLORS.primary}25`,
                borderRadius: 20,
                padding: "28px 35px",
                fontSize: 28,
                color: COLORS.white,
                fontFamily: "sans-serif",
                direction: "rtl",
                display: "flex",
                alignItems: "center",
                gap: 15,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: COLORS.primaryGlow,
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${COLORS.primary}`,
                }}
              />
              {point}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Closing CTA ───
const Scene5_Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainSpring = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const pulseScale = 1 + Math.sin(frame * 0.08) * 0.03;
  const glowOpacity = interpolate(frame, [0, 30, 90, 120], [0, 0.6, 0.6, 0.8], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #0f3d24, ${COLORS.bgDark})`,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}20, transparent 70%)`,
          opacity: glowOpacity,
          transform: `scale(${pulseScale})`,
        }}
      />

      <div
        style={{
          opacity: mainSpring,
          transform: `scale(${interpolate(mainSpring, [0, 1], [0.7, 1])})`,
          textAlign: "center",
          direction: "rtl",
        }}
      >
        {/* Recycling icon */}
        <div style={{ fontSize: 100, marginBottom: 30 }}>♻️</div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: COLORS.white,
            fontFamily: "sans-serif",
            lineHeight: 1.5,
            marginBottom: 20,
            textShadow: `0 0 50px ${COLORS.primary}44`,
          }}
        >
          شركة التوحيد
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.primaryGlow,
            fontFamily: "sans-serif",
            marginBottom: 40,
          }}
        >
          للخدمات البيئية
        </div>

        {/* Divider */}
        <div
          style={{
            width: interpolate(frame, [20, 50], [0, 300], { extrapolateRight: "clamp" }),
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            margin: "0 auto 40px",
          }}
        />

        <div
          style={{
            fontSize: 30,
            color: COLORS.muted,
            fontFamily: "sans-serif",
            lineHeight: 1.8,
          }}
        >
          بيئة نظيفة... مستقبل أفضل 🌱
        </div>

        {/* Contact hint */}
        <div
          style={{
            opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateRight: "clamp" }),
            marginTop: 60,
            fontSize: 24,
            color: COLORS.primary,
            fontFamily: "sans-serif",
            padding: "16px 40px",
            borderRadius: 50,
            border: `1.5px solid ${COLORS.primary}50`,
            background: `${COLORS.primary}10`,
          }}
        >
          تواصل معنا الآن 📞
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ───
export const TawheedReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bgDark }}>
      <Sequence from={0} durationInFrames={120}>
        <Scene1_Intro />
      </Sequence>
      <Sequence from={120} durationInFrames={130}>
        <Scene2_Services />
      </Sequence>
      <Sequence from={250} durationInFrames={120}>
        <Scene3_Stats />
      </Sequence>
      <Sequence from={370} durationInFrames={120}>
        <Scene4_Impact />
      </Sequence>
      <Sequence from={490} durationInFrames={110}>
        <Scene5_Closing />
      </Sequence>
    </AbsoluteFill>
  );
};
