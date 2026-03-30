import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S6Background, S6Header, S6Outro, S6Feature, S6Stat, cairo, inter, mono, C6, t6 } from "./S6Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="تحليلات الأعمال المتقدمة" titleEn="Advanced Business Intelligence" subtitle="بيانات تتحول إلى قرارات — في الوقت الفعلي" episodeNum={33} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📊" titleAr="لوحات تحكم حية" titleEn="Live Dashboards" desc="لوحات تفاعلية بالوقت الفعلي تعرض KPIs والمؤشرات الحيوية" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="🔮" titleAr="تحليل تنبؤي" titleEn="Predictive Analytics" desc="نماذج AI تتنبأ بالطلب المستقبلي والتكاليف والمخاطر" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📈" titleAr="مقارنات أداء" titleEn="Performance Benchmarks" desc="مقارنة أدائك مع معايير الصناعة والفترات السابقة" color={C6.amber} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📤" titleAr="تصدير متعدد" titleEn="Multi-Format Export" desc="تصدير التقارير بصيغ PDF، Excel، CSV مع جداول بيانات تلقائية" color={C6.indigo} />
        </div>
        {/* Chart visualization */}
        <div style={{ width: 360, height: 360, position: "relative" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20 } });
            const th = t6(dark);
            const bars = [65, 82, 45, 90, 72, 88, 55, 95];
            return (
              <div style={{ opacity: s, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 250, padding: "0 10px" }}>
                  {bars.map((h, i) => {
                    const bs = spring({ frame: frame - 80 - i * 8, fps, config: { damping: 15, stiffness: 100 } });
                    const barH = h * 2.5 * bs;
                    const colors = [C6.orange, C6.teal, C6.amber, C6.indigo];
                    return (
                      <div key={i} style={{
                        flex: 1, height: barH, borderRadius: "6px 6px 0 0",
                        background: `linear-gradient(180deg, ${colors[i % 4]}, ${colors[i % 4]}80)`,
                        opacity: 0.8 + bs * 0.2,
                      }} />
                    );
                  })}
                </div>
                <div style={{ height: 2, background: th.borderSoft, marginTop: 4 }} />
                <div style={{ fontFamily: mono, fontSize: 11, color: th.muted, textAlign: "center", marginTop: 8 }}>
                  Real-time Analytics Dashboard
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t6(dark);
  const reports = [
    { icon: "💰", name: "تقارير مالية", en: "Financial Reports", color: C6.orange },
    { icon: "🚛", name: "تقارير الأسطول", en: "Fleet Reports", color: C6.amber },
    { icon: "📦", name: "تقارير الشحنات", en: "Shipment Reports", color: C6.teal },
    { icon: "🌍", name: "تقارير بيئية", en: "Environmental Reports", color: C6.indigo },
    { icon: "👥", name: "تقارير العمالة", en: "Workforce Reports", color: C6.orange },
    { icon: "📋", name: "تقارير الامتثال", en: "Compliance Reports", color: C6.red },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أنواع التقارير" titleEn="Report Categories" episodeNum={33} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {reports.map((r, i) => {
          const s = spring({ frame: frame - 55 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{r.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{r.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: r.color }}>{r.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="قوة البيانات" titleEn="Data Power" episodeNum={33} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📊" value="50+" label="لوحة تحكم" labelEn="Dashboards" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📈" value="Real-time" label="بيانات حية" labelEn="Live Data" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📤" value="3" label="صيغ تصدير" labelEn="Export Formats" color={C6.amber} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔮" value="AI" label="تحليل تنبؤي" labelEn="Predictive AI" color={C6.indigo} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S6Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={33} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep33Dark = () => <EpisodeVideo dark={true} />;
export const Ep33Light = () => <EpisodeVideo dark={false} />;
