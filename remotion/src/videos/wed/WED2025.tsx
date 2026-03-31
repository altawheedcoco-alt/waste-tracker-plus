import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const NEON_GREEN = "#00E676";
const ELECTRIC_BLUE = "#00B0FF";
const DEEP_NAVY = "#0A1628";
const PLASTIC_PINK = "#FF4081";
const SLATE = "#1E293B";
const GLOW_CYAN = "#18FFFF";

const DataGrid: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.06 }}>
      {Array.from({ length: 12 }, (_, row) =>
        Array.from({ length: 18 }, (_, col) => {
          const flicker = Math.sin((frame + row * 7 + col * 13) * 0.1) > 0.3;
          return (
            <div key={`${row}-${col}`} style={{
              position: "absolute",
              left: col * 60, top: row * 90,
              width: 2, height: 2, borderRadius: "50%",
              background: flicker ? NEON_GREEN : ELECTRIC_BLUE,
            }} />
          );
        })
      )}
    </AbsoluteFill>
  );
};

const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 15 } });
  const yearS = spring({ frame: frame - 20, fps, config: { damping: 8, stiffness: 150 } });
  const subOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const glitch = frame > 25 && frame < 35 ? Math.random() * 4 - 2 : 0;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DEEP_NAVY}, ${SLATE})` }}>
      <DataGrid />
      <div style={{
        position: "absolute", top: "20%", width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 26, fontWeight: 300, color: GLOW_CYAN, letterSpacing: 10,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
        }}>
          يوم البيئة العالمي
        </div>
        <div style={{
          fontSize: 160, fontWeight: 900, color: "white",
          transform: `scale(${interpolate(yearS, [0, 1], [0.1, 1])}) translateX(${glitch}px)`,
          textShadow: `0 0 60px ${NEON_GREEN}66, 0 0 120px ${ELECTRIC_BLUE}33`,
          fontFamily: "sans-serif",
        }}>
          2025
        </div>
        <div style={{
          fontSize: 44, fontWeight: 700, color: NEON_GREEN, marginTop: 15,
          opacity: subOp,
          textShadow: `0 0 20px ${NEON_GREEN}44`,
        }}>
          #القضاء_على_التلوث_البلاستيكي
        </div>
        <div style={{
          fontSize: 28, color: ELECTRIC_BLUE, marginTop: 12, opacity: subOp,
        }}>
          🇰🇷 كوريا الجنوبية | المعاهدة العالمية للبلاستيك
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Treaty: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: "📜", title: "معاهدة البلاستيك الدولية", sub: "أول اتفاقية ملزمة قانونياً" },
    { icon: "🌐", text: "175 دولة تتفاوض", sub: "لإنهاء التلوث البلاستيكي" },
    { icon: "🏭", text: "خفض الإنتاج 40%", sub: "بحلول 2040" },
    { icon: "♻️", text: "100% قابل للتدوير", sub: "تصميم دائري إلزامي" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DEEP_NAVY}, ${SLATE})` }}>
      <DataGrid />
      <div style={{
        position: "absolute", top: 50, width: "100%", textAlign: "center",
        fontSize: 36, fontWeight: 800, color: NEON_GREEN,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        textShadow: `0 0 15px ${NEON_GREEN}44`,
      }}>
        نحو عالم بلا بلاستيك
      </div>
      <div style={{
        position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)",
        width: "85%",
      }}>
        {steps.map((s, i) => {
          const delay = 15 + i * 20;
          const sp = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 24,
              marginBottom: 24, padding: "28px 32px",
              background: `linear-gradient(135deg, ${NEON_GREEN}08, ${ELECTRIC_BLUE}08)`,
              borderRadius: 16,
              border: `1px solid ${NEON_GREEN}22`,
              boxShadow: `0 0 20px ${NEON_GREEN}08`,
              transform: `translateX(${interpolate(sp, [0, 1], [-150, 0])}px)`,
              opacity: interpolate(sp, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 56 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "white" }}>
                  {"title" in s ? s.title : s.text}
                </div>
                <div style={{ fontSize: 20, color: GLOW_CYAN, marginTop: 6 }}>{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3Egypt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const achievements = [
    { icon: "🔄", title: "اقتصاد دائري أخضر", desc: "استراتيجية التحول الأخضر العادل", glow: NEON_GREEN },
    { icon: "🏭", title: "مصانع تدوير ذكية", desc: "20 مصنع جديد بتقنيات AI", glow: ELECTRIC_BLUE },
    { icon: "📊", title: "مؤشر المناخ CCPI", desc: "تقدم مصر في ترتيب الأداء المناخي", glow: GLOW_CYAN },
    { icon: "⚡", title: "طاقة نظيفة 42%", desc: "من إجمالي مزيج الطاقة بحلول 2030", glow: NEON_GREEN },
    { icon: "🌍", title: "0.6% فقط", desc: "نصيب مصر من الانبعاثات العالمية", glow: ELECTRIC_BLUE },
    { icon: "🚀", title: "منصة iRecycle", desc: "رقمنة قطاع التدوير بالكامل", glow: PLASTIC_PINK },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${SLATE}, ${DEEP_NAVY})` }}>
      <DataGrid />
      <div style={{
        position: "absolute", top: 30, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 22, color: GLOW_CYAN, letterSpacing: 5,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>🇪🇬</div>
        <div style={{
          fontSize: 34, fontWeight: 800, color: "white", marginTop: 5,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
          textShadow: `0 0 20px ${NEON_GREEN}33`,
        }}>
          مصر 2025: التحول الأخضر الرقمي
        </div>
      </div>
      <div style={{
        position: "absolute", top: 130, left: "50%", transform: "translateX(-50%)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        width: "90%",
      }}>
        {achievements.map((a, i) => {
          const delay = 10 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              background: `${a.glow}08`,
              borderRadius: 16, padding: "18px 16px",
              border: `1px solid ${a.glow}22`,
              boxShadow: `0 0 15px ${a.glow}08`,
              transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40 }}>{a.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white", marginTop: 6 }}>{a.title}</div>
              <div style={{ fontSize: 15, color: a.glow, marginTop: 4 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene4Vision: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const goals = [
    { year: "2025", goal: "معاهدة البلاستيك الملزمة", progress: 85 },
    { year: "2030", goal: "خفض البلاستيك 40%", progress: 60 },
    { year: "2035", goal: "صفر نفايات بلاستيكية للمحيطات", progress: 40 },
    { year: "2040", goal: "اقتصاد دائري كامل", progress: 25 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DEEP_NAVY}, ${SLATE})` }}>
      <DataGrid />
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
        fontSize: 38, fontWeight: 800, color: NEON_GREEN,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        textShadow: `0 0 20px ${NEON_GREEN}44`,
      }}>
        خارطة الطريق العالمية
      </div>
      <div style={{
        position: "absolute", top: 160, left: "50%", transform: "translateX(-50%)",
        width: "82%",
      }}>
        {goals.map((g, i) => {
          const delay = 15 + i * 22;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const barWidth = interpolate(s, [0, 1], [0, g.progress]);
          return (
            <div key={i} style={{
              marginBottom: 35,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
              transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: GLOW_CYAN }}>{g.year}</div>
                <div style={{ fontSize: 22, color: "white" }}>{g.goal}</div>
              </div>
              <div style={{
                height: 20, borderRadius: 10,
                background: `${NEON_GREEN}15`,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${barWidth}%`, height: "100%",
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${NEON_GREEN}, ${ELECTRIC_BLUE})`,
                  boxShadow: `0 0 15px ${NEON_GREEN}44`,
                }} />
              </div>
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
  const s = spring({ frame, fps, config: { damping: 20 } });
  const pulse = Math.sin(frame * 0.08) * 0.04 + 1;
  const scanline = (frame * 3) % 1080;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DEEP_NAVY}, ${SLATE})` }}>
      <DataGrid />
      {/* Scanline effect */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: scanline,
        height: 2, background: `${NEON_GREEN}15`,
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 80, opacity: interpolate(s, [0, 1], [0, 1]),
        }}>♻️</div>
        <div style={{
          fontSize: 48, fontWeight: 800, color: "white",
          transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
          opacity: interpolate(s, [0, 1], [0, 1]),
          textShadow: `0 0 30px ${NEON_GREEN}44`,
        }}>
          المستقبل أخضر ورقمي
        </div>
        <div style={{
          fontSize: 28, color: NEON_GREEN, marginTop: 20,
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          التكنولوجيا في خدمة الكوكب
        </div>
        <div style={{
          fontSize: 20, color: GLOW_CYAN, marginTop: 35,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          iRecycle™ | يوم البيئة العالمي 2025
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WED2025: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={360}><Scene1Intro /></Sequence>
      <Sequence from={360} durationInFrames={360}><Scene2Treaty /></Sequence>
      <Sequence from={720} durationInFrames={420}><Scene3Egypt /></Sequence>
      <Sequence from={1140} durationInFrames={360}><Scene4Vision /></Sequence>
      <Sequence from={1500} durationInFrames={300}><Scene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
