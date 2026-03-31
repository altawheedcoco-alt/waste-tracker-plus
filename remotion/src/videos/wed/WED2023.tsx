import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

const OCEAN_BLUE = "#006064";
const CORAL = "#FF6F61";
const MINT = "#00BFA5";
const IVORY = "#FAFAFA";
const DARK_SEA = "#002838";

const PlasticWave: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {[0, 1, 2].map((i) => {
        const waveY = Math.sin((frame + i * 40) * 0.04) * 15;
        return (
          <div key={i} style={{
            position: "absolute",
            bottom: 40 + i * 30 + waveY,
            left: 0, right: 0, height: 80,
            background: `linear-gradient(180deg, transparent, ${OCEAN_BLUE}${20 + i * 15})`,
            borderRadius: "50% 50% 0 0",
            transform: `translateX(${Math.sin((frame + i * 60) * 0.02) * 20}px)`,
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
  const yearS = spring({ frame: frame - 30, fps, config: { damping: 8 } });
  const subOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DARK_SEA}, ${OCEAN_BLUE})` }}>
      <PlasticWave />
      <div style={{
        position: "absolute", top: "20%", width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 28, fontWeight: 300, color: MINT, letterSpacing: 8,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
        }}>
          يوم البيئة العالمي
        </div>
        <div style={{
          fontSize: 150, fontWeight: 900, color: "white",
          transform: `scale(${interpolate(yearS, [0, 1], [0.3, 1])})`,
          textShadow: `0 4px 60px ${CORAL}66`,
        }}>
          2023
        </div>
        <div style={{
          fontSize: 48, fontWeight: 700, color: CORAL, marginTop: 20,
          opacity: subOp,
        }}>
          #القضاء_على_التلوث_البلاستيكي
        </div>
        <div style={{
          fontSize: 30, color: MINT, marginTop: 15, opacity: subOp,
        }}>
          🇨🇮 كوت ديفوار | #BeatPlasticPollution
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const facts = [
    { icon: "🏭", num: "430M", text: "طن بلاستيك يُنتج سنوياً" },
    { icon: "🌊", num: "11M", text: "طن تصل للمحيطات كل عام" },
    { icon: "🔬", num: "5µm", text: "بلاستيك دقيق في طعامنا ومياهنا" },
    { icon: "⏳", num: "450", text: "سنة لتحلل زجاجة بلاستيك واحدة" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${DARK_SEA}, #1B3A4B)` }}>
      <div style={{
        position: "absolute", top: 50, width: "100%", textAlign: "center",
        color: CORAL, fontSize: 38, fontWeight: 800,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        أزمة البلاستيك العالمية
      </div>
      <div style={{
        position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30,
        width: "88%",
      }}>
        {facts.map((f, i) => {
          const delay = 15 + i * 20;
          const s = spring({ frame: frame - delay, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              background: `rgba(255,111,97,0.08)`,
              border: `1px solid ${CORAL}33`,
              borderRadius: 20, padding: 30, textAlign: "center",
              transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 56 }}>{f.icon}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: CORAL, marginTop: 10 }}>{f.num}</div>
              <div style={{ fontSize: 22, color: IVORY, marginTop: 8 }}>{f.text}</div>
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

  const actions = [
    { icon: "🏗️", title: "ما بعد COP27", desc: "تنفيذ مخرجات شرم الشيخ", detail: "خطة عمل وطنية شاملة" },
    { icon: "♻️", title: "استراتيجية النفايات", desc: "تحويل 80% من النفايات بحلول 2030", detail: "مصانع تدوير جديدة" },
    { icon: "🌊", title: "حماية البحار", desc: "تنظيف الشواطئ والمحميات البحرية", detail: "البحر الأحمر والمتوسط" },
    { icon: "📜", title: "المعاهدة العالمية", desc: "مصر تدعم معاهدة البلاستيك الدولية", detail: "INC-2 باريس" },
    { icon: "🏭", title: "صناعات التدوير", desc: "تشجيع الاقتصاد الدائري", detail: "حوافز ضريبية وتمويلية" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #1B3A4B, ${OCEAN_BLUE})` }}>
      <div style={{
        position: "absolute", top: 35, width: "100%", textAlign: "center",
      }}>
        <div style={{
          fontSize: 26, color: MINT, letterSpacing: 4,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>🇪🇬</div>
        <div style={{
          fontSize: 38, fontWeight: 800, color: "white", marginTop: 5,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          مصر تحارب التلوث البلاستيكي
        </div>
      </div>
      <div style={{
        position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)",
        width: "85%",
      }}>
        {actions.map((a, i) => {
          const delay = 15 + i * 16;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -200 : 200, 0]);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              marginBottom: 16,
              background: "rgba(0,191,165,0.08)",
              borderRadius: 16, padding: "18px 28px",
              border: `1px solid ${MINT}22`,
              transform: `translateX(${x}px)`,
              opacity: interpolate(s, [0, 0.3], [0, 1]),
            }}>
              <div style={{ fontSize: 48, minWidth: 60, textAlign: "center" }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "white" }}>{a.title}</div>
                <div style={{ fontSize: 18, color: MINT }}>{a.desc}</div>
              </div>
              <div style={{
                fontSize: 16, color: CORAL, background: `${CORAL}15`,
                borderRadius: 10, padding: "6px 14px", fontWeight: 600,
              }}>{a.detail}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene4Solutions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const solutions = [
    { icon: "🔄", text: "إعادة التصميم", color: MINT },
    { icon: "♻️", text: "إعادة الاستخدام", color: "#4FC3F7" },
    { icon: "🏭", text: "إعادة التدوير", color: CORAL },
    { icon: "🌱", text: "بدائل حيوية", color: "#AED581" },
    { icon: "📋", text: "تشريعات صارمة", color: MINT },
  ];

  const centerX = 540;
  const centerY = 450;
  const radius = 280;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${OCEAN_BLUE}, ${DARK_SEA})` }}>
      <div style={{
        position: "absolute", top: 50, width: "100%", textAlign: "center",
        fontSize: 40, fontWeight: 800, color: "white",
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        حلول القضاء على البلاستيك
      </div>
      {/* Circular layout */}
      {solutions.map((s, i) => {
        const angle = (i / solutions.length) * Math.PI * 2 - Math.PI / 2;
        const delay = 20 + i * 15;
        const sp = spring({ frame: frame - delay, fps, config: { damping: 15 } });
        const x = centerX + Math.cos(angle + frame * 0.005) * radius * interpolate(sp, [0, 1], [0, 1]);
        const y = centerY + Math.sin(angle + frame * 0.005) * radius * interpolate(sp, [0, 1], [0, 1]);
        return (
          <div key={i} style={{
            position: "absolute",
            left: x - 70, top: y - 70,
            width: 140, height: 140, borderRadius: "50%",
            background: `${s.color}22`,
            border: `2px solid ${s.color}66`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            opacity: interpolate(sp, [0, 0.3], [0, 1]),
          }}>
            <div style={{ fontSize: 40 }}>{s.icon}</div>
            <div style={{ fontSize: 16, color: s.color, fontWeight: 700, marginTop: 6 }}>{s.text}</div>
          </div>
        );
      })}
      {/* Center */}
      <div style={{
        position: "absolute",
        left: centerX - 60, top: centerY - 60,
        width: 120, height: 120, borderRadius: "50%",
        background: `linear-gradient(135deg, ${CORAL}, ${MINT})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 40px ${CORAL}44`,
        opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "white", textAlign: "center" }}>
          اقتصاد<br/>دائري
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20 } });
  const pulse = Math.sin(frame * 0.08) * 0.03 + 1;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${DARK_SEA}, ${OCEAN_BLUE})` }}>
      <PlasticWave />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) scale(${pulse})`,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 80, opacity: interpolate(s, [0, 1], [0, 1]),
        }}>🌊</div>
        <div style={{
          fontSize: 48, fontWeight: 800, color: "white",
          transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
          opacity: interpolate(s, [0, 1], [0, 1]),
        }}>
          محيطاتنا تستحق أفضل
        </div>
        <div style={{
          fontSize: 30, color: CORAL, marginTop: 20,
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          معاً نقضي على التلوث البلاستيكي
        </div>
        <div style={{
          fontSize: 20, color: MINT, marginTop: 35,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          iRecycle™ | يوم البيئة العالمي 2023
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WED2023: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={360}><Scene1Intro /></Sequence>
      <Sequence from={360} durationInFrames={360}><Scene2Problem /></Sequence>
      <Sequence from={720} durationInFrames={420}><Scene3Egypt /></Sequence>
      <Sequence from={1140} durationInFrames={360}><Scene4Solutions /></Sequence>
      <Sequence from={1500} durationInFrames={300}><Scene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
