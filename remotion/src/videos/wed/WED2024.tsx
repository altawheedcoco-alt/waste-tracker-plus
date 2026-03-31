import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const SAND_GOLD = "#D4A373";
const DESERT_DARK = "#3E2723";
const TERRACOTTA = "#BF360C";
const SAGE = "#558B2F";
const WARM_WHITE = "#FFF3E0";
const EARTH_BROWN = "#5D4037";

const SandParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: (i * 97.3) % 100,
    y: (i * 61.7) % 100,
    size: 2 + (i % 4),
    dx: 0.5 + (i % 3) * 0.3,
    delay: i * 5,
  }));

  return (
    <AbsoluteFill>
      {particles.map((p, i) => {
        const x = (p.x + (frame - p.delay) * p.dx) % 120 - 10;
        const y = p.y + Math.sin((frame + p.delay) * 0.05) * 8;
        const opacity = interpolate(
          Math.sin((frame + p.delay) * 0.04), [-1, 1], [0.05, 0.25]
        );
        return (
          <div key={i} style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: SAND_GOLD, opacity,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 15 } });
  const yearS = spring({ frame: frame - 25, fps, config: { damping: 10 } });
  const subOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DESERT_DARK}, ${EARTH_BROWN}, ${TERRACOTTA}88)` }}>
      <SandParticles />
      <div style={{
        position: "absolute", top: "22%", width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 26, fontWeight: 300, color: SAND_GOLD, letterSpacing: 8,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
        }}>
          يوم البيئة العالمي
        </div>
        <div style={{
          fontSize: 150, fontWeight: 900, color: WARM_WHITE,
          transform: `scale(${interpolate(yearS, [0, 1], [0.2, 1])})`,
          textShadow: `0 4px 50px ${TERRACOTTA}88`,
        }}>
          2024
        </div>
        <div style={{
          fontSize: 42, fontWeight: 700, color: SAND_GOLD, marginTop: 20,
          opacity: subOp,
        }}>
          #أرضنا_مستقبلنا
        </div>
        <div style={{
          fontSize: 28, color: WARM_WHITE, marginTop: 12, opacity: subOp, fontWeight: 300,
        }}>
          🇸🇦 المملكة العربية السعودية | إصلاح الأراضي
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Crisis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const data = [
    { icon: "🏜️", stat: "40%", label: "من أراضي العالم متدهورة" },
    { icon: "👥", stat: "3.2B", label: "شخص متأثر بتدهور الأراضي" },
    { icon: "🌡️", stat: "+1.5°C", label: "ارتفاع الحرارة العالمية" },
    { icon: "💧", stat: "2B", label: "شخص يعاني ندرة المياه" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DESERT_DARK}, #4E342E)` }}>
      <SandParticles />
      <div style={{
        position: "absolute", top: 50, width: "100%", textAlign: "center",
        fontSize: 38, fontWeight: 800, color: TERRACOTTA,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        تحديات الأراضي والتصحر
      </div>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 35,
      }}>
        {data.map((d, i) => {
          const delay = 15 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              textAlign: "center", padding: 25,
              background: `${SAND_GOLD}12`,
              borderRadius: 20,
              border: `1px solid ${SAND_GOLD}33`,
              transform: `scale(${interpolate(s, [0, 1], [0.5, 1])}) rotate(${interpolate(s, [0, 1], [-5, 0])}deg)`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 56 }}>{d.icon}</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: SAND_GOLD, marginTop: 8 }}>{d.stat}</div>
              <div style={{ fontSize: 20, color: WARM_WHITE, marginTop: 6 }}>{d.label}</div>
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

  const projects = [
    { icon: "🌳", title: "المبادرة الرئاسية للتشجير", desc: "زراعة 100 مليون شجرة", stat: "حتى 2030" },
    { icon: "🏗️", title: "مشروع الدلتا الجديدة", desc: "استصلاح 2.2 مليون فدان", stat: "أكبر مشروع زراعي" },
    { icon: "💧", title: "محطات التحلية", desc: "17 محطة تحلية عملاقة", stat: "6.4M م³/يوم" },
    { icon: "☀️", title: "الطاقة الشمسية", desc: "مجمع بنبان أكبر محطة بأفريقيا", stat: "1.8 GW" },
    { icon: "🌿", title: "المحميات الطبيعية", desc: "30 محمية طبيعية معلنة", stat: "15% من المساحة" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${EARTH_BROWN}, ${SAGE}99)` }}>
      <div style={{
        position: "absolute", top: 35, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 24, color: SAND_GOLD, letterSpacing: 4,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>🇪🇬 مصر تُعيد إحياء أراضيها</div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: WARM_WHITE, marginTop: 8,
          opacity: interpolate(frame, [8, 28], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          مشاريع عملاقة لإصلاح الأرض
        </div>
      </div>
      <div style={{
        position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)",
        width: "88%",
      }}>
        {projects.map((p, i) => {
          const delay = 12 + i * 14;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 18,
              marginBottom: 14, padding: "16px 24px",
              background: `${SAND_GOLD}12`,
              borderRadius: 14, border: `1px solid ${SAND_GOLD}22`,
              transform: `translateX(${interpolate(s, [0, 1], [i % 2 === 0 ? -180 : 180, 0])}px)`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 44, minWidth: 55, textAlign: "center" }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: WARM_WHITE }}>{p.title}</div>
                <div style={{ fontSize: 16, color: SAND_GOLD }}>{p.desc}</div>
              </div>
              <div style={{
                fontSize: 15, color: TERRACOTTA, background: `${TERRACOTTA}18`,
                borderRadius: 10, padding: "5px 12px", fontWeight: 700,
              }}>{p.stat}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene4Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const milestones = [
    { year: "2014", event: "دستور 2014 يكفل حق البيئة النظيفة" },
    { year: "2018", event: "مبادرة حياة كريمة لتطوير الريف" },
    { year: "2020", event: "قانون إدارة المخلفات 202" },
    { year: "2022", event: "استضافة COP27 في شرم الشيخ" },
    { year: "2024", event: "إطلاق الاستراتيجية الوطنية للتنمية الخضراء" },
  ];

  const lineProgress = interpolate(frame, [0, 120], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DESERT_DARK}, ${EARTH_BROWN})` }}>
      <div style={{
        position: "absolute", top: 50, width: "100%", textAlign: "center",
        fontSize: 36, fontWeight: 800, color: SAND_GOLD,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        مسيرة مصر البيئية
      </div>
      {/* Vertical line */}
      <div style={{
        position: "absolute", left: 120, top: 130,
        width: 4, height: `${lineProgress}%`,
        maxHeight: 700,
        background: `linear-gradient(180deg, ${SAND_GOLD}, ${SAGE})`,
        borderRadius: 2,
      }} />
      {milestones.map((m, i) => {
        const delay = 15 + i * 22;
        const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
        return (
          <div key={i} style={{
            position: "absolute", left: 100, top: 130 + i * 140,
            display: "flex", alignItems: "center", gap: 20,
            opacity: interpolate(s, [0, 0.3], [0, 1]),
            transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: SAND_GOLD, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: DESERT_DARK,
              boxShadow: `0 0 20px ${SAND_GOLD}44`,
            }}>{m.year}</div>
            <div style={{
              background: `${SAND_GOLD}12`,
              borderRadius: 14, padding: "14px 24px",
              border: `1px solid ${SAND_GOLD}22`,
              maxWidth: 700,
            }}>
              <div style={{ fontSize: 22, color: WARM_WHITE, fontWeight: 600 }}>{m.event}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20 } });
  const pulse = Math.sin(frame * 0.07) * 0.04 + 1;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${EARTH_BROWN}, ${SAGE}AA)` }}>
      <SandParticles />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 80, opacity: interpolate(s, [0, 1], [0, 1]) }}>🌱</div>
        <div style={{
          fontSize: 48, fontWeight: 800, color: WARM_WHITE,
          transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
          opacity: interpolate(s, [0, 1], [0, 1]),
        }}>
          أرضنا هي مستقبلنا
        </div>
        <div style={{
          fontSize: 28, color: SAND_GOLD, marginTop: 20,
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          كل شجرة نزرعها هي أمل لأجيال قادمة
        </div>
        <div style={{
          fontSize: 20, color: WARM_WHITE, marginTop: 35, opacity: 0.7,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          iRecycle™ | يوم البيئة العالمي 2024
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WED2024: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={360}><Scene1Intro /></Sequence>
      <Sequence from={360} durationInFrames={360}><Scene2Crisis /></Sequence>
      <Sequence from={720} durationInFrames={420}><Scene3Egypt /></Sequence>
      <Sequence from={1140} durationInFrames={360}><Scene4Timeline /></Sequence>
      <Sequence from={1500} durationInFrames={300}><Scene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
