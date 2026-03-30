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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="المستشعرات البيئية" titleEn="Environmental Monitoring Sensors" subtitle="مراقبة جودة الهواء والمياه والتربة حول مواقع إدارة المخلفات" episodeNum={36} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="💨" titleAr="جودة الهواء" titleEn="Air Quality Index (AQI)" desc="قياس PM2.5 وPM10 والغازات السامة (CO, NO₂, SO₂) في محيط المرافق" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="💧" titleAr="تحليل المياه" titleEn="Water Quality Sensors" desc="مراقبة pH والعكارة والأكسجين المذاب في مصادر المياه القريبة" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🌱" titleAr="صحة التربة" titleEn="Soil Health Monitoring" desc="قياس مستويات المعادن الثقيلة والتلوث العضوي في التربة المحيطة" color={C7.matrix} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔊" titleAr="الضوضاء والاهتزاز" titleEn="Noise & Vibration" desc="رصد مستويات الضوضاء والاهتزاز لضمان الامتثال البيئي" color={C7.pulse} />
        </div>
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 65, fps, config: { damping: 20 } });
            return (
              <div style={{ opacity: s, position: "relative" }}>
                {/* Pulsing rings */}
                {[0, 1, 2, 3].map((i) => {
                  const ringPulse = (frame * 0.02 + i * 0.25) % 1;
                  return (
                    <div key={i} style={{
                      position: "absolute", left: "50%", top: "50%",
                      width: 100 + ringPulse * 200, height: 100 + ringPulse * 200,
                      borderRadius: "50%", border: `1px solid ${C7.neon}`,
                      transform: "translate(-50%, -50%)",
                      opacity: (1 - ringPulse) * 0.4,
                    }} />
                  );
                })}
                <div style={{ fontSize: 64, position: "relative", zIndex: 1 }}>🌍</div>
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
  const items = [
    { icon: "📡", name: "شبكة LoRaWAN", en: "LoRaWAN Network", color: C7.neon },
    { icon: "☁️", name: "سحابة البيانات", en: "Cloud Data Lake", color: C7.cyan },
    { icon: "🤖", name: "تحليل AI", en: "AI Analysis", color: C7.pulse },
    { icon: "📋", name: "تقارير الامتثال", en: "Compliance Reports", color: C7.electric },
    { icon: "🚨", name: "إنذار مبكر", en: "Early Warning System", color: C7.warm },
    { icon: "📱", name: "إشعارات فورية", en: "Instant Notifications", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="البنية التحتية للمراقبة" titleEn="Monitoring Infrastructure" episodeNum={36} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {items.map((item, i) => {
          const s = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${item.color}15`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{item.name}</div>
              <div style={{ fontFamily: fira, fontSize: 12, color: item.color }}>{item.en}</div>
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="أثر المراقبة البيئية" titleEn="Environmental Impact" episodeNum={36} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="💨" value="24/7" label="مراقبة مستمرة" labelEn="Continuous Monitoring" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📊" value="50+" label="معيار بيئي" labelEn="Environmental Params" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🚨" value="<5min" label="وقت التنبيه" labelEn="Alert Time" color={C7.pulse} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📋" value="100%" label="امتثال بيئي" labelEn="Compliance Rate" color={C7.matrix} />
      </div>
    </AbsoluteFill>
  );
};

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
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={36} nextTitle="Predictive Analytics" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep36Dark = () => <EpisodeVideo dark={true} />;
export const Ep36Light = () => <EpisodeVideo dark={false} />;
