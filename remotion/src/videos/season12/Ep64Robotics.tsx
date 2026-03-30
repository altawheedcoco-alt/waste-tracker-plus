import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12 } from "./S12Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="الروبوتات والأتمتة" titleEn="Robotics & Autonomous Systems" subtitle="روبوتات ذكية تعمل بشكل مستقل في فرز ومعالجة المخلفات" episodeNum={64} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S12Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🤖" titleAr="روبوتات الفرز" titleEn="Sorting Robots" desc="أذرع روبوتية بالرؤية الحاسوبية تفرز المخلفات بدقة 99% وسرعة 120 قطعة/دقيقة" color={C12.prism} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🚗" titleAr="مركبات ذاتية" titleEn="Autonomous Vehicles" desc="شاحنات جمع ذاتية القيادة تعمل بالليل لتقليل الازدحام والانبعاثات" color={C12.holo} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🦾" titleAr="الأتمتة الكاملة" titleEn="Full Automation" desc="خطوط معالجة آلية بالكامل — من الاستقبال حتى المنتج النهائي" color={C12.shine} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🧠" titleAr="AI التشغيلي" titleEn="Operational AI" desc="ذكاء اصطناعي يدير العمليات اليومية ويتخذ قرارات تلقائية" color={C12.mint} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الأتمتة" titleEn="Automation Impact" episodeNum={64} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🤖" value="99%" label="دقة الفرز" labelEn="Sort Accuracy" color={C12.prism} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="10x" label="زيادة الإنتاجية" labelEn="Productivity" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🌍" value="70%" label="خفض الانبعاثات" labelEn="CO₂ Reduction" color={C12.shine} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💰" value="60%" label="توفير التكاليف" labelEn="Cost Savings" color={C12.mint} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S12Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S12Outro frame={0} fps={30} dark={dark} episodeNum={64} nextTitle="Blockchain & Carbon Credits" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};
export const Ep64Dark = () => <EpisodeVideo dark={true} />;
export const Ep64Light = () => <EpisodeVideo dark={false} />;
