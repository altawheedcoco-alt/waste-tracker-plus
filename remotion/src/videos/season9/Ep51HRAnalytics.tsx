import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="تحليلات الموارد البشرية" titleEn="HR Analytics & Insights" subtitle="لوحات تحكم ذكية تكشف أنماط الأداء وتساعد في اتخاذ القرارات" episodeNum={51} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📊" titleAr="لوحة HR" titleEn="HR Dashboard" desc="رؤية شاملة — عدد الموظفين، معدل الدوران، تكلفة التوظيف، رضا الفريق" color={C9.olive} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔮" titleAr="تنبؤ الاستقالات" titleEn="Attrition Prediction" desc="نماذج AI تتنبأ باحتمالية استقالة الموظفين قبل حدوثها بأسابيع" color={C9.khaki} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📈" titleAr="مؤشرات الأداء" titleEn="KPI Tracking" desc="تتبع مؤشرات الأداء الفردية والجماعية مع مقارنات زمنية ومرجعية" color={C9.tactical} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🗺️" titleAr="خريطة المهارات" titleEn="Skills Map" desc="خريطة كفاءات تفاعلية تحدد نقاط القوة والفجوات وخطط التطوير" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="تأثير التحليلات" titleEn="Analytics Impact" episodeNum={51} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📊" value="360°" label="رؤية شاملة" labelEn="Full View" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔮" value="87%" label="دقة التنبؤ" labelEn="Prediction Acc." color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📈" value="40%" label="تحسن الإنتاجية" labelEn="Productivity Up" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💡" value="Real-time" label="بيانات حية" labelEn="Live Data" color={C9.amber} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={51} /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};
export const Ep51Dark = () => <EpisodeVideo dark={true} />;
export const Ep51Light = () => <EpisodeVideo dark={false} />;
