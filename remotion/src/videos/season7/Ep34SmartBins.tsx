import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S7Background, S7Header, S7Outro, S7Feature, S7Stat, cairo, inter, fira, C7, t7 } from "./S7Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="الحاويات الذكية" titleEn="Smart Bins & IoT Sensors" subtitle="حاويات متصلة بالإنترنت تراقب المستوى والحرارة والوزن لحظياً" episodeNum={34} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📡" titleAr="مستشعرات المستوى" titleEn="Fill-Level Sensors" desc="قياس نسبة الامتلاء بالأشعة فوق صوتية وإرسال البيانات عبر LoRaWAN كل ١٥ دقيقة" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🌡️" titleAr="مراقبة الحرارة" titleEn="Temperature Monitoring" desc="كشف الحرارة المرتفعة في الحاويات لمنع الاشتعال التلقائي والتنبيه الفوري" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="⚖️" titleAr="الوزن الحي" titleEn="Real-time Weighing" desc="خلايا تحميل مدمجة تقيس الوزن الفعلي لتحسين حسابات التكلفة والفوترة" color={C7.electric} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔋" titleAr="طاقة شمسية" titleEn="Solar-Powered" desc="ألواح شمسية مدمجة تغذي المستشعرات ذاتياً دون حاجة لبطاريات خارجية" color={C7.warm} />
        </div>
        {/* IoT visualization */}
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 65, fps, config: { damping: 20, stiffness: 120 } });
            return (
              <div style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`, position: "relative" }}>
                {[0, 1, 2, 3].map((i) => {
                  const angle = (i / 4) * Math.PI * 2 + frame * 0.01;
                  const dist = 100 + Math.sin(frame * 0.03 + i) * 15;
                  const pulse = 0.5 + Math.sin(frame * 0.05 + i * 1.5) * 0.3;
                  return (
                    <div key={i} style={{
                      position: "absolute",
                      left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                      top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                      transform: "translate(-50%, -50%)",
                      width: 40, height: 40, borderRadius: "50%",
                      background: `${[C7.neon, C7.cyan, C7.electric, C7.warm][i]}15`,
                      border: `2px solid ${[C7.neon, C7.cyan, C7.electric, C7.warm][i]}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, opacity: pulse,
                      boxShadow: dark ? `0 0 15px ${[C7.neon, C7.cyan, C7.electric, C7.warm][i]}30` : "none",
                    }}>
                      {["📡", "🌡️", "⚖️", "🔋"][i]}
                    </div>
                  );
                })}
                <div style={{ fontSize: 64, position: "relative", zIndex: 1, filter: dark ? `drop-shadow(0 0 20px ${C7.neon}30)` : "none" }}>🗑️</div>
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
  const dataPoints = [
    { icon: "📊", name: "لوحة البيانات الحية", en: "Live Dashboard", color: C7.neon },
    { icon: "🗺️", name: "خريطة الحاويات", en: "Bin Map View", color: C7.cyan },
    { icon: "⚠️", name: "تنبيهات ذكية", en: "Smart Alerts", color: C7.pulse },
    { icon: "📈", name: "تحليل الأنماط", en: "Pattern Analytics", color: C7.electric },
    { icon: "🔄", name: "جدولة تلقائية", en: "Auto Scheduling", color: C7.warm },
    { icon: "📱", name: "تطبيق الميدان", en: "Field App", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="منظومة البيانات الحية" titleEn="Real-Time Data Ecosystem" episodeNum={34} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {dataPoints.map((d, i) => {
          const s = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${d.color}15`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              boxShadow: dark ? `0 0 20px ${d.color}08` : "none",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{d.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{d.name}</div>
              <div style={{ fontFamily: fira, fontSize: 12, color: d.color }}>{d.en}</div>
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="أرقام المستشعرات" titleEn="IoT Impact Metrics" episodeNum={34} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📡" value="10K+" label="مستشعر نشط" labelEn="Active Sensors" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📊" value="40%" label="تقليل الرحلات" labelEn="Fewer Trips" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⚡" value="<1s" label="زمن الاستجابة" labelEn="Response Time" color={C7.electric} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🌍" value="30%" label="خفض الانبعاثات" labelEn="CO₂ Reduction" color={C7.matrix} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={34} nextTitle="Fleet Telematics" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep34Dark = () => <EpisodeVideo dark={true} />;
export const Ep34Light = () => <EpisodeVideo dark={false} />;
