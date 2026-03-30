import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="الرواتب والمزايا" titleEn="Payroll & Benefits System" subtitle="نظام رواتب آلي متكامل مع حساب المكافآت والخصومات والتأمينات" episodeNum={50} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="💰" titleAr="حساب الرواتب" titleEn="Payroll Calculation" desc="حساب تلقائي للرواتب مع ساعات إضافية، بدلات، خصومات وضرائب" color={C9.olive} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🏥" titleAr="التأمينات" titleEn="Insurance & Benefits" desc="إدارة التأمين الصحي والاجتماعي مع تسجيل تلقائي وتجديد" color={C9.khaki} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🎁" titleAr="المكافآت" titleEn="Incentives & Bonuses" desc="نظام مكافآت ذكي مربوط بمؤشرات الأداء — عمولات، مكافآت شهرية" color={C9.tactical} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📄" titleAr="كشوف الرواتب" titleEn="Pay Slips" desc="كشوف رواتب رقمية مفصلة قابلة للتحميل مع أرشيف كامل" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="كفاءة الرواتب" titleEn="Payroll Efficiency" episodeNum={50} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="💰" value="100%" label="دقة الحسابات" labelEn="Accuracy" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⏱️" value="<1h" label="وقت المعالجة" labelEn="Processing Time" color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="50%" label="توفير إداري" labelEn="Admin Savings" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🎁" value="25%" label="تحسن الاحتفاظ" labelEn="Retention Up" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S9Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={50} nextTitle="HR Analytics" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};
export const Ep50Dark = () => <EpisodeVideo dark={true} />;
export const Ep50Light = () => <EpisodeVideo dark={false} />;
