import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="الضرائب والامتثال المالي" titleEn="Tax & Financial Compliance" subtitle="نظام ضريبي متكامل يدعم الفاتورة الإلكترونية ومعايير المحاسبة الدولية" episodeNum={42} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🏛️" titleAr="الفاتورة الإلكترونية" titleEn="E-Invoice Integration" desc="تكامل كامل مع منظومة الفاتورة الإلكترونية المصرية — توقيع رقمي وإرسال تلقائي" color={C8.gold} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📋" titleAr="إقرارات ضريبية" titleEn="Tax Returns" desc="حساب تلقائي لضريبة القيمة المضافة مع تقارير جاهزة للتقديم" color={C8.amber} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔍" titleAr="تدقيق مالي" titleEn="Financial Audit Trail" desc="سجل كامل لكل معاملة مالية مع إمكانية التصدير للمراجعين الخارجيين" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="مقاييس الامتثال" titleEn="Compliance Metrics" episodeNum={42} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏛️" value="100%" label="امتثال ضريبي" labelEn="Tax Compliant" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📋" value="IFRS" label="معايير دولية" labelEn="International Standards" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔍" value="Full" label="سجل تدقيق" labelEn="Audit Trail" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S8Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={42} nextTitle="Partner Accounts" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};
export const Ep42Dark = () => <EpisodeVideo dark={true} />;
export const Ep42Light = () => <EpisodeVideo dark={false} />;
