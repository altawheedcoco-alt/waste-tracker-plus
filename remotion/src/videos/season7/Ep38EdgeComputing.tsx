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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="الحوسبة الطرفية" titleEn="Edge Computing & Local AI" subtitle="معالجة البيانات محلياً على الأجهزة لقرارات فورية بدون تأخير الشبكة" episodeNum={38} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🖥️" titleAr="معالجة محلية" titleEn="Local Processing" desc="أجهزة Edge تعالج البيانات في الموقع دون الحاجة للاتصال بالسحابة" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="⚡" titleAr="استجابة فورية" titleEn="Real-time Response" desc="قرارات بزمن استجابة أقل من ١٠ ميلي ثانية للحالات الحرجة" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔒" titleAr="خصوصية البيانات" titleEn="Data Privacy" desc="البيانات الحساسة تبقى محلية — تُرسل فقط الملخصات للسحابة" color={C7.electric} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📵" titleAr="عمل بدون إنترنت" titleEn="Offline Operation" desc="النظام يعمل بكفاءة كاملة حتى عند انقطاع الاتصال بالإنترنت" color={C7.warm} />
        </div>
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 65, fps, config: { damping: 20 } });
            return (
              <div style={{ opacity: s, position: "relative" }}>
                {/* Central edge device with radial connections */}
                <div style={{
                  width: 80, height: 80, borderRadius: 16,
                  background: `${C7.neon}15`, border: `2px solid ${C7.neon}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, boxShadow: dark ? `0 0 30px ${C7.neon}30` : "none",
                  position: "relative", zIndex: 2,
                }}>🖥️</div>
                {/* Orbiting data packets */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const a = (i / 6) * Math.PI * 2 + frame * 0.025;
                  const r = 120;
                  const x = Math.cos(a) * r;
                  const y = Math.sin(a) * r;
                  return (
                    <div key={i} style={{
                      position: "absolute", left: `calc(50% + ${x}px - 6px)`, top: `calc(50% + ${y}px - 6px)`,
                      width: 12, height: 12, borderRadius: "50%",
                      background: [C7.neon, C7.cyan, C7.electric, C7.pulse, C7.warm, C7.matrix][i],
                      opacity: 0.6 + Math.sin(frame * 0.05 + i) * 0.3,
                      boxShadow: dark ? `0 0 8px ${[C7.neon, C7.cyan, C7.electric, C7.pulse, C7.warm, C7.matrix][i]}50` : "none",
                    }} />
                  );
                })}
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
    { icon: "🤖", name: "AI محلي", en: "On-Device AI", color: C7.neon },
    { icon: "🔄", name: "مزامنة ذكية", en: "Smart Sync", color: C7.cyan },
    { icon: "🛡️", name: "أمان طرفي", en: "Edge Security", color: C7.electric },
    { icon: "📦", name: "حاويات Docker", en: "Containerized Apps", color: C7.pulse },
    { icon: "🔌", name: "بروتوكولات IoT", en: "MQTT / CoAP", color: C7.warm },
    { icon: "📊", name: "تجميع البيانات", en: "Data Aggregation", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="تقنيات الحافة" titleEn="Edge Technologies" episodeNum={38} />
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="أداء الحوسبة الطرفية" titleEn="Edge Performance" episodeNum={38} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⚡" value="<10ms" label="زمن الاستجابة" labelEn="Latency" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📵" value="100%" label="عمل بلا إنترنت" labelEn="Offline Capable" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔒" value="E2E" label="تشفير كامل" labelEn="End-to-End Encrypted" color={C7.electric} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="90%" label="توفير عرض النطاق" labelEn="Bandwidth Saved" color={C7.pulse} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={38} nextTitle="Digital Twins" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep38Dark = () => <EpisodeVideo dark={true} />;
export const Ep38Light = () => <EpisodeVideo dark={false} />;
