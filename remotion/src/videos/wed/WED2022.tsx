import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const EARTH_GREEN = "#1B5E20";
const SKY_BLUE = "#0D47A1";
const GOLD = "#FFD54F";
const SAND = "#FFF8E1";
const DEEP_TEAL = "#004D40";

const FloatingParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: ((i * 73.7) % 100),
    size: 3 + (i % 5) * 2,
    speed: 0.3 + (i % 4) * 0.2,
    delay: i * 7,
  }));

  return (
    <AbsoluteFill>
      {particles.map((p, i) => {
        const y = p.y - ((frame - p.delay) * p.speed) % 120;
        const opacity = interpolate(
          Math.sin((frame + p.delay) * 0.03),
          [-1, 1],
          [0.1, 0.4]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 2 === 0 ? GOLD : "#81C784",
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const earthScale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const titleY = spring({ frame: frame - 20, fps, config: { damping: 20 } });
  const subtitleOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const yearScale = spring({ frame: frame - 50, fps, config: { damping: 8 } });
  const globeRotate = frame * 0.5;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DEEP_TEAL}, ${SKY_BLUE})` }}>
      <FloatingParticles />
      {/* Earth Circle */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${earthScale}) rotate(${globeRotate}deg)`,
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, ${EARTH_GREEN}, ${SKY_BLUE} 70%)`,
        boxShadow: `0 0 120px ${EARTH_GREEN}44, inset 0 0 80px ${SKY_BLUE}88`,
        opacity: 0.3,
      }} />
      {/* Title */}
      <div style={{
        position: "absolute", top: "25%", width: "100%", textAlign: "center",
        transform: `translateY(${interpolate(titleY, [0, 1], [80, 0])}px)`,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 300, color: GOLD, letterSpacing: 8,
          textTransform: "uppercase", marginBottom: 20,
        }}>
          يوم البيئة العالمي
        </div>
        <div style={{
          fontSize: 140, fontWeight: 900, color: "white",
          transform: `scale(${yearScale})`,
          textShadow: `0 4px 40px ${EARTH_GREEN}88`,
          fontFamily: "sans-serif",
        }}>
          2022
        </div>
      </div>
      {/* Subtitle */}
      <div style={{
        position: "absolute", bottom: "18%", width: "100%", textAlign: "center",
        opacity: subtitleOp,
      }}>
        <div style={{
          fontSize: 48, fontWeight: 700, color: GOLD,
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          #أرض_واحدة_فقط
        </div>
        <div style={{
          fontSize: 32, color: "white", marginTop: 15, fontWeight: 300,
        }}>
          #OnlyOneEarth | 🇸🇪 السويد
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Theme: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { icon: "🌍", text: "أرض واحدة فقط", sub: "شعار مؤتمر ستوكهولم 1972" },
    { icon: "🔄", text: "50 عاماً من العمل البيئي", sub: "الذكرى الخمسون لأول مؤتمر بيئي" },
    { icon: "⚡", text: "أزمة كوكبية ثلاثية", sub: "المناخ • التنوع البيولوجي • التلوث" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DEEP_TEAL}, #1A237E)` }}>
      <FloatingParticles />
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 36, color: GOLD, fontWeight: 700,
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          موضوع 2022
        </div>
      </div>
      {items.map((item, i) => {
        const delay = 20 + i * 25;
        const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
        const x = interpolate(s, [0, 1], [300, 0]);
        return (
          <div key={i} style={{
            position: "absolute", top: 180 + i * 220, left: "50%",
            transform: `translateX(calc(-50% + ${x}px))`,
            opacity: interpolate(s, [0, 0.5], [0, 1]),
            display: "flex", alignItems: "center", gap: 30,
            background: "rgba(255,255,255,0.08)", borderRadius: 24,
            padding: "30px 50px", backdropFilter: "none",
            border: "1px solid rgba(255,255,255,0.15)",
            width: "80%", maxWidth: 800,
          }}>
            <div style={{ fontSize: 80 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "white" }}>{item.text}</div>
              <div style={{ fontSize: 24, color: GOLD, marginTop: 8 }}>{item.sub}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene3Egypt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const achievements = [
    { icon: "🏛️", title: "COP27 شرم الشيخ", desc: "مصر تستضيف قمة المناخ الأكبر", stat: "نوفمبر 2022" },
    { icon: "💰", title: "خطة الاستثمار المناخي", desc: "أول دولة تتبنى خطة مع صندوق المناخ الأخضر", stat: "$14.7 مليار" },
    { icon: "🌱", title: "منصة نُوَفِّي NWFE", desc: "مشاريع الطاقة والغذاء والمياه الخضراء", stat: "9 مشاريع كبرى" },
    { icon: "⚡", title: "الطاقة المتجددة", desc: "مجمع بنبان للطاقة الشمسية", stat: "1.8 جيجاوات" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #1A237E, ${EARTH_GREEN})` }}>
      <div style={{
        position: "absolute", top: 40, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 24, color: GOLD, letterSpacing: 5,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          🇪🇬 دور مصر الريادي
        </div>
        <div style={{
          fontSize: 44, color: "white", fontWeight: 800, marginTop: 10,
          opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          مصر وقمة المناخ COP27
        </div>
      </div>
      <div style={{
        position: "absolute", top: 170, left: "50%", transform: "translateX(-50%)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        width: "90%", maxWidth: 900,
      }}>
        {achievements.map((a, i) => {
          const delay = 15 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const scale = interpolate(s, [0, 1], [0.7, 1]);
          return (
            <div key={i} style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 20, padding: "25px 20px",
              border: `1px solid ${GOLD}33`,
              transform: `scale(${scale})`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
              textAlign: "center",
            }}>
              <div style={{ fontSize: 56 }}>{a.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "white", marginTop: 8 }}>{a.title}</div>
              <div style={{ fontSize: 18, color: "#B0BEC5", marginTop: 6 }}>{a.desc}</div>
              <div style={{
                fontSize: 22, color: GOLD, fontWeight: 800, marginTop: 10,
                background: `${GOLD}15`, borderRadius: 12, padding: "6px 16px",
                display: "inline-block",
              }}>{a.stat}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene4Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stats = [
    { value: "150+", label: "دولة شاركت", icon: "🌐" },
    { value: "45,000", label: "مشارك في COP27", icon: "👥" },
    { value: "$14.7B", label: "تمويل مناخي", icon: "💵" },
    { value: "0.6%", label: "نصيب مصر من الانبعاثات", icon: "📊" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${EARTH_GREEN}, #0D47A1)` }}>
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 40, fontWeight: 800, color: "white",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          أرقام وإنجازات 2022
        </div>
      </div>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40,
      }}>
        {stats.map((s, i) => {
          const delay = 10 + i * 20;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 12 } });
          const count = interpolate(sp, [0, 1], [0, 1]);
          return (
            <div key={i} style={{
              textAlign: "center",
              transform: `scale(${interpolate(sp, [0, 1], [0.5, 1])})`,
              opacity: interpolate(sp, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 64 }}>{s.icon}</div>
              <div style={{
                fontSize: 56, fontWeight: 900, color: GOLD,
                textShadow: `0 0 30px ${GOLD}66`,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 24, color: "white", marginTop: 8 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin(frame * 0.08) * 0.05 + 1;
  const s = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DEEP_TEAL}, ${SKY_BLUE})` }}>
      <FloatingParticles />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 80, marginBottom: 30,
          opacity: interpolate(s, [0, 1], [0, 1]),
        }}>🌍</div>
        <div style={{
          fontSize: 52, fontWeight: 800, color: "white",
          opacity: interpolate(s, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        }}>
          لدينا أرض واحدة فقط
        </div>
        <div style={{
          fontSize: 32, color: GOLD, marginTop: 20,
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          فلنحافظ عليها معاً
        </div>
        <div style={{
          fontSize: 22, color: "#B0BEC5", marginTop: 40,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          iRecycle™ | يوم البيئة العالمي 2022
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WED2022: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={360}><Scene1Intro /></Sequence>
      <Sequence from={360} durationInFrames={360}><Scene2Theme /></Sequence>
      <Sequence from={720} durationInFrames={420}><Scene3Egypt /></Sequence>
      <Sequence from={1140} durationInFrames={360}><Scene4Stats /></Sequence>
      <Sequence from={1500} durationInFrames={300}><Scene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
