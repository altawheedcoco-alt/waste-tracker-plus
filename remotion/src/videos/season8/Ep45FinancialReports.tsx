import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="التقارير المالية المتقدمة" titleEn="Advanced Financial Reports" subtitle="تقارير مالية شاملة بصيغ متعددة — PDF, Excel, Dashboard" episodeNum={45} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📊" titleAr="لوحة مالية حية" titleEn="Live Financial Dashboard" desc="لوحة تحكم مالية تفاعلية تعرض المؤشرات الرئيسية لحظياً" color={C8.gold} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📑" titleAr="تقارير دورية" titleEn="Periodic Reports" desc="تقارير يومية، أسبوعية، شهرية — تُرسل تلقائياً عبر البريد الإلكتروني" color={C8.amber} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔄" titleAr="مقارنات مالية" titleEn="Financial Comparisons" desc="مقارنة الأداء المالي عبر الفترات والمناطق وأنواع المخلفات" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="قدرات التقارير" titleEn="Reporting Capabilities" episodeNum={45} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📊" value="50+" label="نوع تقرير" labelEn="Report Types" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📑" value="Auto" label="إرسال تلقائي" labelEn="Auto Delivery" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔄" value="∞" label="فترات مقارنة" labelEn="Comparison Periods" color={C8.emerald} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={45} /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};
export const Ep45Dark = () => <EpisodeVideo dark={true} />;
export const Ep45Light = () => <EpisodeVideo dark={false} />;
