import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="تحليل التكاليف" titleEn="Cost Analysis & Budgeting" subtitle="أدوات متقدمة لتحليل التكاليف التشغيلية وتخطيط الميزانيات" episodeNum={41} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📈" titleAr="تحليل هوامش الربح" titleEn="Profit Margin Analysis" desc="تتبع الربحية لكل شحنة ونوع مخلفات وعميل مع مقارنات زمنية" color={C8.gold} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🎯" titleAr="مراكز التكلفة" titleEn="Cost Centers" desc="توزيع التكاليف على المشاريع والأقسام والمناطق الجغرافية" color={C8.amber} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="💹" titleAr="التنبؤ المالي" titleEn="Financial Forecasting" desc="نماذج AI تتنبأ بالإيرادات والمصروفات المستقبلية بدقة عالية" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="مؤشرات التكاليف" titleEn="Cost Metrics" episodeNum={41} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📈" value="25%" label="خفض التكاليف" labelEn="Cost Reduction" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🎯" value="100+" label="مركز تكلفة" labelEn="Cost Centers" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💹" value="92%" label="دقة التنبؤ" labelEn="Forecast Accuracy" color={C8.emerald} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={41} nextTitle="Tax & Compliance" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};
export const Ep41Dark = () => <EpisodeVideo dark={true} />;
export const Ep41Light = () => <EpisodeVideo dark={false} />;
