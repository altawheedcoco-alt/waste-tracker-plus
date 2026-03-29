import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S4Background, S4Header, S4Outro, S4Feature, S4Stat, S4Dashboard, GlassCard, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S4Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  // Animated scale
  const scaleProgress = interpolate(frame - 80, [0, 90], [0, 24.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s1 = spring({ frame: frame - 50, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="الميزان والقياس الدقيق" titleEn="Weighbridge & Precision Measurement" subtitle="وزن دقيق وموثق لكل شحنة مع تسجيل آلي" episodeNum={19} />
      <div style={{ display: "flex", gap: 50, marginTop: 50 }}>
        {/* Weighbridge visualization */}
        <GlassCard frame={frame} fps={fps} dark={dark} delay={60} style={{ width: 480, padding: "36px 40px" }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: C.amber, marginBottom: 20 }}>⚖️ WEIGHBRIDGE LIVE</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{
              fontFamily: mono, fontSize: 72, fontWeight: 700, color: C.amber,
              opacity: s1, transform: `scale(${interpolate(s1, [0, 1], [0.5, 1])})`,
            }}>
              {scaleProgress.toFixed(1)} <span style={{ fontSize: 28, color: th.muted }}>طن</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "الوزن الفارغ", value: "12.3 طن", color: C.cyan },
              { label: "الوزن الإجمالي", value: "36.8 طن", color: C.emerald },
              { label: "صافي الحمولة", value: "24.5 طن", color: C.amber },
            ].map((w, i) => (
              <div key={i} style={{
                flex: 1, padding: "12px 10px", background: `${w.color}08`, borderRadius: 10, border: `1px solid ${w.color}15`, textAlign: "center",
                opacity: spring({ frame: frame - 120 - i * 12, fps, config: { damping: 16 } }),
              }}>
                <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: w.color }}>{w.value}</div>
                <div style={{ fontFamily: cairo, fontSize: 13, color: th.muted, marginTop: 4 }}>{w.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={70} icon="⚖️" titleAr="وزن تلقائي" titleEn="Auto Weighing" desc="ربط مباشر مع الموازين الرقمية لتسجيل الوزن تلقائياً" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📸" titleAr="صورة الميزان" titleEn="Weighbridge Photo" desc="التقاط آلي لصورة الشاحنة على الميزان كإثبات" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={110} icon="🔄" titleAr="وزن مزدوج" titleEn="Dual Weighing" desc="وزن الدخول والخروج لحساب صافي الحمولة بدقة" color={C.cyan} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="التكامل مع أنظمة القياس" titleEn="Measurement Integration" episodeNum={19} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🏭" titleAr="ربط الموازين الصناعية" titleEn="Industrial Scale Integration" desc="دعم جميع أنواع الموازين الرقمية مع معايرة دورية تلقائية" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="📊" titleAr="تحليل الانحرافات" titleEn="Deviation Analysis" desc="مقارنة الوزن الفعلي بالتقديري وتنبيه عند وجود فروقات كبيرة" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="📱" titleAr="تطبيق الميزان المحمول" titleEn="Mobile Weighing App" desc="تسجيل الأوزان من الموقع عبر التطبيق مع مزامنة فورية" color={C.cyan} />
        </div>
        <S4Dashboard frame={frame} fps={fps} dark={dark} delay={70} title="Weighbridge Dashboard" />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الوزن" titleEn="Weighing Statistics" episodeNum={19} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⚖️" value="125K" label="عملية وزن" labelEn="Weighing Ops" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📦" value="890K" label="طن مقاس" labelEn="Tons Measured" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="99.8%" label="دقة الوزن" labelEn="Accuracy" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="⏱️" value="<2min" label="وقت العملية" labelEn="Process Time" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={99} size={140} color={C.amber} label="دقة القياس" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={97} size={140} color={C.emerald} label="معايرة الموازين" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={95} size={140} color={C.cyan} label="رضا العملاء" dark={dark} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S4Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={19} nextTitle="Pricing" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep19Dark = () => <EpisodeVideo dark={true} />;
export const Ep19Light = () => <EpisodeVideo dark={false} />;
