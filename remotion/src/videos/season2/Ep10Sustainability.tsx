import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { S2Background, SectionHeader, StatCard, FeatureItem, S2Outro, cairo, inter, mono, COLORS, theme } from "./S2Common";

const TRANS = 25;

// Scene 1: Sustainability Impact
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  // Animated earth visual
  const earthS = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 60, mass: 2 } });
  const earthRot = interpolate(frame, [0, 2250], [0, 180]);

  // ESG meters
  const esgData = [
    { letter: "E", label: "بيئي", en: "Environmental", score: 94, color: COLORS.green },
    { letter: "S", label: "اجتماعي", en: "Social", score: 88, color: COLORS.blue },
    { letter: "G", label: "حوكمة", en: "Governance", score: 91, color: "#8B5CF6" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="أثر الاستدامة وتقارير ESG" titleEn="Sustainability Impact & ESG Reports" subtitle="قياس وتتبع الأثر البيئي لمؤسستك" episodeNum={10} />

      <div style={{ display: "flex", gap: 60, marginTop: 40, alignItems: "center" }}>
        {/* Earth visual */}
        <div style={{
          width: 280, height: 280, borderRadius: "50%",
          background: `conic-gradient(from ${earthRot}deg, ${COLORS.green}30, ${COLORS.blue}20, ${COLORS.green}10, ${COLORS.blue}30, ${COLORS.green}20)`,
          border: `2px solid ${COLORS.green}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${interpolate(earthS, [0, 1], [0.3, 1])})`, opacity: earthS,
          position: "relative",
        }}>
          <div style={{ fontSize: 100 }}>🌍</div>
          {/* Orbiting dot */}
          <div style={{
            position: "absolute", width: "100%", height: "100%",
            transform: `rotate(${earthRot * 2}deg)`,
          }}>
            <div style={{
              position: "absolute", top: -6, left: "50%", width: 12, height: 12,
              borderRadius: "50%", background: COLORS.green,
              boxShadow: `0 0 15px ${COLORS.green}60`,
              transform: "translateX(-50%)",
            }} />
          </div>
        </div>

        {/* ESG Scores */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {esgData.map((esg, i) => {
            const barS = spring({ frame: frame - 80 - i * 20, fps, config: { damping: 14, stiffness: 80, mass: 1.5 } });
            const barWidth = interpolate(barS, [0, 1], [0, esg.score]);
            return (
              <div key={i} style={{ opacity: barS }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${esg.color}15`, border: `1px solid ${esg.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: inter, fontSize: 22, fontWeight: 900, color: esg.color,
                  }}>{esg.letter}</div>
                  <div>
                    <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: t.text }}>{esg.label}</div>
                    <div style={{ fontFamily: inter, fontSize: 12, color: t.muted }}>{esg.en}</div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: esg.color, marginRight: "auto" }}>
                    {Math.round(barWidth)}%
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 8, borderRadius: 4,
                  background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}>
                  <div style={{
                    width: `${barWidth}%`, height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg, ${esg.color}, ${esg.color}80)`,
                    boxShadow: `0 0 10px ${esg.color}30`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Carbon Footprint & Impact
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  const impacts = [
    { icon: "🌱", value: "2,450", unit: "طن CO₂", label: "تم تجنب انبعاثها", en: "CO₂ Avoided", color: COLORS.green },
    { icon: "🔄", value: "18,300", unit: "طن", label: "مخلفات أُعيد تدويرها", en: "Waste Recycled", color: COLORS.blue },
    { icon: "💧", value: "5.2M", unit: "لتر", label: "مياه تم توفيرها", en: "Water Saved", color: "#06B6D4" },
    { icon: "⚡", value: "890K", unit: "kWh", label: "طاقة مُوفرة", en: "Energy Saved", color: "#F59E0B" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="بصمتك الكربونية" titleEn="Your Carbon Footprint Impact" episodeNum={10} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 50 }}>
        {impacts.map((item, i) => {
          const s = spring({ frame: frame - 40 - i * 18, fps, config: { damping: 16, stiffness: 160 } });
          const countUp = interpolate(s, [0, 1], [0, 1]);
          return (
            <div key={i} style={{
              background: t.card, border: `1px solid ${item.color}15`, borderRadius: 16,
              padding: "28px 32px", opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
              position: "relative", overflow: "hidden",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", top: -30, right: -30, width: 100, height: 100,
                borderRadius: "50%", background: `radial-gradient(circle, ${item.color}10 0%, transparent 70%)`,
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ fontSize: 40 }}>{item.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 700, color: item.color }}>{item.value}</div>
                    <div style={{ fontFamily: inter, fontSize: 14, color: t.muted }}>{item.unit}</div>
                  </div>
                  <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: t.text, marginTop: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: inter, fontSize: 12, color: t.muted }}>{item.en}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Reporting Features
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { titleAr: "تقارير ESG تلقائية", titleEn: "Automated ESG Reports", desc: "توليد تقارير استدامة معتمدة دولياً بمعايير GRI و SASB بضغطة زر", color: COLORS.green },
    { titleAr: "حاسبة البصمة الكربونية", titleEn: "Carbon Calculator", desc: "حساب دقيق للانبعاثات المتجنبة والطاقة المُوفرة لكل عملية", color: COLORS.blue },
    { titleAr: "شهادات خضراء معتمدة", titleEn: "Green Certificates", desc: "إصدار شهادات بيئية رقمية موثقة للمؤسسات والشركاء", color: "#10B981" },
    { titleAr: "أهداف التنمية المستدامة", titleEn: "SDG Alignment", desc: "ربط أنشطتك بأهداف الأمم المتحدة للتنمية المستدامة (SDGs)", color: "#F59E0B" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="أدوات تقارير الاستدامة" titleEn="Sustainability Reporting Tools" episodeNum={10} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 40 }}>
        {features.map((f, i) => (
          <div key={i} style={{ padding: "0 8px" }}>
            <FeatureItem frame={frame} fps={fps} dark={dark} delay={30 + i * 20} titleAr={f.titleAr} titleEn={f.titleEn} desc={f.desc} color={f.color} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Final stats + outro
const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {frame < 250 ? (
        <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
          <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="أثرنا البيئي معاً" titleEn="Our Collective Impact" episodeNum={10} />
          <div style={{ display: "flex", gap: 24, marginTop: 50, justifyContent: "center", flexWrap: "wrap" }}>
            <StatCard frame={frame} fps={fps} dark={dark} delay={20} icon="🌍" value="17" label="هدف أممي مدعوم" labelEn="SDGs Supported" />
            <StatCard frame={frame} fps={fps} dark={dark} delay={35} icon="📊" value="500+" label="تقرير ESG صادر" labelEn="ESG Reports" />
            <StatCard frame={frame} fps={fps} dark={dark} delay={50} icon="🏅" value="ISO 14001" label="معتمد دولياً" labelEn="Certified" />
            <StatCard frame={frame} fps={fps} dark={dark} delay={65} icon="🤝" value="200+" label="شريك أخضر" labelEn="Green Partners" />
          </div>
        </AbsoluteFill>
      ) : (
        <S2Outro frame={frame - 250} fps={fps} dark={dark} episodeNum={10} />
      )}
    </AbsoluteFill>
  );
};

const Ep10Content = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S2Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={650}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={580}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={500}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={600}><Scene4 dark={dark} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S2Background>
  );
};

export const Ep10Dark = () => <Ep10Content dark />;
export const Ep10Light = () => <Ep10Content dark={false} />;
