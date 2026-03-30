import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S7Background, S7Header, S7Outro, S7Feature, S7Stat, C7, t7, cairo, fira } from "./S7Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="التحليلات التنبؤية" titleEn="Predictive IoT Analytics" subtitle="خوارزميات تعلم الآلة تتنبأ بالصيانة والامتلاء قبل حدوثها" episodeNum={37} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🧠" titleAr="تنبؤ الامتلاء" titleEn="Fill Prediction AI" desc="نماذج تعلم آلي تتنبأ بموعد امتلاء كل حاوية بدقة ٩٥٪ لمدة ٧ أيام قادمة" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔧" titleAr="صيانة تنبؤية" titleEn="Predictive Maintenance" desc="كشف أعطال المعدات والمركبات قبل حدوثها بناءً على بيانات الأداء التاريخية" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📈" titleAr="تحسين الطلب" titleEn="Demand Forecasting" desc="توقع حجم المخلفات الموسمي لتخطيط الموارد والطاقة الاستيعابية" color={C7.electric} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🎯" titleAr="تحسين مستمر" titleEn="Continuous Optimization" desc="النظام يتعلم ويحسّن نفسه تلقائياً مع كل دورة بيانات جديدة" color={C7.pulse} />
        </div>
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 65, fps, config: { damping: 20 } });
            // Neural network visualization
            const layers = [3, 5, 5, 3];
            return (
              <div style={{ opacity: s, position: "relative", width: 300, height: 300 }}>
                <svg width="300" height="300" viewBox="0 0 300 300">
                  {layers.map((count, li) => {
                    const x = 40 + li * 75;
                    return Array.from({ length: count }).map((_, ni) => {
                      const y = 150 - ((count - 1) * 30) / 2 + ni * 30;
                      const pulse = 0.4 + Math.sin(frame * 0.05 + li + ni) * 0.3;
                      // Connections to next layer
                      const nextCount = layers[li + 1];
                      return (
                        <React.Fragment key={`${li}-${ni}`}>
                          {nextCount && Array.from({ length: nextCount }).map((_, nj) => {
                            const nx = 40 + (li + 1) * 75;
                            const ny = 150 - ((nextCount - 1) * 30) / 2 + nj * 30;
                            return <line key={nj} x1={x} y1={y} x2={nx} y2={ny} stroke={C7.neon} strokeWidth={0.5} opacity={pulse * 0.5} />;
                          })}
                          <circle cx={x} cy={y} r={6} fill={C7.neon} opacity={pulse} />
                        </React.Fragment>
                      );
                    });
                  })}
                </svg>
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
  const th = t7(dark);
  const models = [
    { icon: "📊", name: "تحليل السلاسل الزمنية", en: "Time Series Analysis", color: C7.neon },
    { icon: "🌳", name: "غابات القرار", en: "Random Forests", color: C7.cyan },
    { icon: "🧬", name: "شبكات عصبية", en: "Neural Networks", color: C7.pulse },
    { icon: "📉", name: "كشف الشذوذ", en: "Anomaly Detection", color: C7.electric },
    { icon: "🔮", name: "نماذج الانحدار", en: "Regression Models", color: C7.warm },
    { icon: "🎲", name: "محاكاة مونت كارلو", en: "Monte Carlo Sim", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="نماذج الذكاء المتقدمة" titleEn="Advanced ML Models" episodeNum={37} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {models.map((m, i) => {
          const s = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${m.color}15`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{m.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontFamily: fira, fontSize: 12, color: m.color }}>{m.en}</div>
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="نتائج التنبؤ" titleEn="Prediction Results" episodeNum={37} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🧠" value="95%" label="دقة التنبؤ" labelEn="Prediction Accuracy" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔧" value="60%" label="تقليل الأعطال" labelEn="Breakdown Reduction" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💰" value="35%" label="توفير التكاليف" labelEn="Cost Savings" color={C7.electric} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📈" value="7d" label="أفق التنبؤ" labelEn="Forecast Horizon" color={C7.pulse} />
      </div>
    </AbsoluteFill>
  );
};

import React from "react";

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S7Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={37} nextTitle="Edge Computing" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep37Dark = () => <EpisodeVideo dark={true} />;
export const Ep37Light = () => <EpisodeVideo dark={false} />;
