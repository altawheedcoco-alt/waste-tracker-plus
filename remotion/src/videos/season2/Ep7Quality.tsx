import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { S2Background, SectionHeader, StatCard, FeatureItem, S2Outro, cairo, inter, mono, COLORS, theme } from "./S2Common";

const TRANS = 25;

// Scene 1: Quality Control Intro
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  // Animated checklist
  const checks = [
    { label: "فحص النوع والتصنيف", en: "Type Classification", status: "passed" },
    { label: "قياس الوزن والكمية", en: "Weight Measurement", status: "passed" },
    { label: "تحليل نسبة التلوث", en: "Contamination Analysis", status: "warning" },
    { label: "مطابقة المعايير البيئية", en: "Environmental Standards", status: "passed" },
    { label: "إصدار شهادة الجودة", en: "Quality Certificate", status: "pending" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="مراقبة الجودة والامتثال" titleEn="Quality Control & Compliance" subtitle="ضمان أعلى معايير الجودة والسلامة البيئية" episodeNum={7} />

      <div style={{ display: "flex", gap: 50, marginTop: 40 }}>
        {/* Checklist */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {checks.map((c, i) => {
            const s = spring({ frame: frame - 60 - i * 20, fps, config: { damping: 18, stiffness: 180 } });
            const statusColor = c.status === "passed" ? COLORS.green : c.status === "warning" ? "#F59E0B" : COLORS.blue;
            const statusIcon = c.status === "passed" ? "✓" : c.status === "warning" ? "!" : "○";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: "16px 20px", opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: mono, fontSize: 16, fontWeight: 700, color: statusColor,
                }}>{statusIcon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: t.text }}>{c.label}</div>
                  <div style={{ fontFamily: inter, fontSize: 12, color: t.muted }}>{c.en}</div>
                </div>
                <div style={{
                  fontFamily: mono, fontSize: 11, color: statusColor,
                  background: `${statusColor}10`, padding: "4px 10px", borderRadius: 6,
                }}>{c.status.toUpperCase()}</div>
              </div>
            );
          })}
        </div>

        {/* Gauge */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const gaugeS = spring({ frame: frame - 100, fps, config: { damping: 12, stiffness: 60, mass: 2 } });
            const score = interpolate(gaugeS, [0, 1], [0, 92]);
            const angle = interpolate(score, [0, 100], [-135, 135]);
            return (
              <>
                <div style={{
                  width: 200, height: 200, borderRadius: "50%",
                  border: `3px solid ${t.border}`,
                  background: t.card,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", width: 3, height: 70, background: COLORS.green,
                    borderRadius: 2, bottom: "50%", left: "calc(50% - 1.5px)",
                    transformOrigin: "bottom center",
                    transform: `rotate(${angle}deg)`,
                  }} />
                  <div style={{ fontFamily: mono, fontSize: 48, fontWeight: 700, color: COLORS.green, marginTop: 20 }}>{Math.round(score)}%</div>
                </div>
                <div style={{ fontFamily: cairo, fontSize: 18, color: t.text, marginTop: 16 }}>درجة الامتثال</div>
                <div style={{ fontFamily: inter, fontSize: 13, color: t.muted }}>Compliance Score</div>
              </>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Compliance Features
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { titleAr: "تراخيص بيئية رقمية", titleEn: "Digital Environmental Permits", desc: "إدارة ومتابعة جميع التراخيص والتصاريح البيئية إلكترونياً مع تنبيهات التجديد", color: COLORS.green },
    { titleAr: "شهادات التخلص الآمن", titleEn: "Safe Disposal Certificates", desc: "إصدار تلقائي لشهادات التخلص المعتمدة بتوقيع رقمي وباركود تحقق", color: COLORS.blue },
    { titleAr: "سجل التدقيق الكامل", titleEn: "Full Audit Trail", desc: "تتبع كل عملية من لحظة الاستلام حتى المعالجة النهائية مع طوابع زمنية", color: "#F59E0B" },
    { titleAr: "تنبيهات المخالفات", titleEn: "Violation Alerts", desc: "إشعارات فورية عند اكتشاف أي انحراف عن المعايير البيئية المعتمدة", color: "#EF4444" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="أدوات الامتثال البيئي" titleEn="Environmental Compliance Tools" episodeNum={7} />
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

// Scene 3: Stats
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="نتائج مراقبة الجودة" titleEn="Quality Control Results" episodeNum={7} />
      <div style={{ display: "flex", gap: 24, marginTop: 50, justifyContent: "center", flexWrap: "wrap" }}>
        <StatCard frame={frame} fps={fps} dark={dark} delay={30} icon="🔍" value="99.2%" label="دقة الفحص" labelEn="Inspection Accuracy" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={45} icon="📋" value="15K+" label="شهادة صادرة" labelEn="Certificates Issued" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={60} icon="⚠️" value="0.3%" label="نسبة المخالفات" labelEn="Violation Rate" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={75} icon="🏆" value="A+" label="تصنيف الامتثال" labelEn="Compliance Rating" />
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <S2Outro frame={frame} fps={fps} dark={dark} episodeNum={7} nextTitle="Customer Portal" />;
};

const Ep7Content = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S2Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={620}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={550}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={500}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={400}><Scene4 dark={dark} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S2Background>
  );
};

export const Ep7Dark = () => <Ep7Content dark />;
export const Ep7Light = () => <Ep7Content dark={false} />;
