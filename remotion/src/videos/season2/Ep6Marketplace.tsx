import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { S2Background, SectionHeader, StatCard, FeatureItem, DashMockup, S2Outro, cairo, inter, mono, COLORS, theme } from "./S2Common";

const TRANS = 25;

// Scene 1: Intro — The Digital Marketplace
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  const s1 = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 200 } });
  const s2 = spring({ frame: frame - 40, fps, config: { damping: 18 } });
  const s3 = spring({ frame: frame - 70, fps, config: { damping: 16 } });

  // Animated connection lines
  const lineProgress = interpolate(frame, [80, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="السوق الرقمي للمخلفات" titleEn="Digital Waste Marketplace" subtitle="ربط ذكي بين المنشآت المولدة والمصانع المعالجة" episodeNum={6} />

      <div style={{ display: "flex", gap: 60, marginTop: 50, alignItems: "center" }}>
        {/* Left: supplier/buyer diagram */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {["مصنع إنتاج", "مستشفى", "فندق", "مطعم"].map((name, i) => {
            const cardS = spring({ frame: frame - 90 - i * 12, fps, config: { damping: 16, stiffness: 180 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: "14px 20px", opacity: cardS,
                transform: `translateX(${interpolate(cardS, [0, 1], [60, 0])}px)`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.green, boxShadow: `0 0 8px ${COLORS.green}40` }} />
                <div style={{ fontFamily: cairo, fontSize: 18, color: t.text }}>{name}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: COLORS.green, marginRight: "auto" }}>SUPPLIER</div>
              </div>
            );
          })}
        </div>

        {/* Center: connection hub */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: s2 }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.green}20 0%, transparent 70%)`,
            border: `2px solid ${COLORS.green}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, transform: `scale(${interpolate(s2, [0, 1], [0.5, 1])})`,
          }}>🔄</div>
          <div style={{ fontFamily: mono, fontSize: 12, color: COLORS.blue }}>MATCHING ENGINE</div>
          {/* Animated bars */}
          <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: 4, height: 12 + Math.sin((frame + i * 20) * 0.1) * 8,
                background: COLORS.green, borderRadius: 2, opacity: 0.6,
              }} />
            ))}
          </div>
        </div>

        {/* Right: buyers */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {["مصنع إعادة تدوير", "محطة معالجة", "مركز فرز"].map((name, i) => {
            const cardS = spring({ frame: frame - 100 - i * 12, fps, config: { damping: 16, stiffness: 180 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: t.card, border: `1px solid ${COLORS.blue}15`, borderRadius: 10,
                padding: "14px 20px", opacity: cardS,
                transform: `translateX(${interpolate(cardS, [0, 1], [-60, 0])}px)`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.blue, boxShadow: `0 0 8px ${COLORS.blue}40` }} />
                <div style={{ fontFamily: cairo, fontSize: 18, color: t.text }}>{name}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: COLORS.blue, marginRight: "auto" }}>BUYER</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Marketplace Features
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { titleAr: "مطابقة ذكية بالذكاء الاصطناعي", titleEn: "AI-Powered Matching", desc: "تحليل تلقائي لنوع المخلفات وكميتها ومطابقتها مع أفضل مشتري", color: COLORS.green },
    { titleAr: "عروض أسعار فورية", titleEn: "Instant Price Quotes", desc: "أسعار لحظية بناءً على السوق ونوع المادة والكمية المتاحة", color: COLORS.blue },
    { titleAr: "تقييمات وسمعة", titleEn: "Ratings & Reputation", desc: "نظام تقييم شامل لكل طرف يضمن الثقة والجودة في التعاملات", color: "#F59E0B" },
    { titleAr: "عقود ذكية رقمية", titleEn: "Smart Digital Contracts", desc: "عقود إلكترونية موثقة مع شروط دفع ومواعيد تسليم محددة", color: "#EC4899" },
    { titleAr: "إشعارات فرص جديدة", titleEn: "Opportunity Alerts", desc: "تنبيهات فورية عند توفر مواد جديدة تطابق احتياجاتك", color: "#8B5CF6" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="مميزات السوق الرقمي" titleEn="Marketplace Features" episodeNum={6} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40 }}>
        {features.map((f, i) => (
          <FeatureItem key={i} frame={frame} fps={fps} dark={dark} delay={30 + i * 18} titleAr={f.titleAr} titleEn={f.titleEn} desc={f.desc} color={f.color} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Statistics
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="أرقام السوق" titleEn="Marketplace Metrics" episodeNum={6} />
      <div style={{ display: "flex", gap: 24, marginTop: 50, flexWrap: "wrap", justifyContent: "center" }}>
        <StatCard frame={frame} fps={fps} dark={dark} delay={30} icon="📦" value="12,500+" label="طلب شهري" labelEn="Monthly Orders" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={45} icon="🏭" value="340+" label="مصنع معالجة" labelEn="Processing Plants" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={60} icon="💰" value="98%" label="نسبة إتمام الصفقات" labelEn="Deal Completion" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={75} icon="⚡" value="<2h" label="متوسط وقت المطابقة" labelEn="Avg Match Time" />
      </div>
      <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
        <DashMockup frame={frame} fps={fps} dark={dark} delay={90} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Outro
const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <S2Outro frame={frame} fps={fps} dark={dark} episodeNum={6} nextTitle="Quality Control" />;
};

const Ep6Content = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S2Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={600}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={550}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={400}><Scene4 dark={dark} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S2Background>
  );
};

export const Ep6Dark = () => <Ep6Content dark />;
export const Ep6Light = () => <Ep6Content dark={false} />;
