import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="حسابات الشركاء" titleEn="Partner Accounts & Settlements" subtitle="إدارة مالية شاملة لحسابات الشركاء والتسويات" episodeNum={43} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🤝" titleAr="كشف حساب الشريك" titleEn="Partner Statements" desc="كشف حساب تفصيلي لكل شريك مع تتبع الأرصدة والمعاملات" color={C8.gold} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="💱" titleAr="تسويات آلية" titleEn="Auto Settlements" desc="مطابقة وتسوية الحسابات تلقائياً مع إشعارات الفروقات" color={C8.amber} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📄" titleAr="عقود وشروط" titleEn="Contract Terms" desc="ربط الشروط المالية بالعقود — أسعار خاصة، خصومات كمية، فترات ائتمان" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="أداء الشركاء" titleEn="Partner Performance" episodeNum={43} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🤝" value="500+" label="شريك نشط" labelEn="Active Partners" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="💱" value="Auto" label="تسوية آلية" labelEn="Auto Settlement" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📄" value="0" label="أخطاء مالية" labelEn="Zero Errors" color={C8.emerald} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={43} nextTitle="Digital Wallet" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};
export const Ep43Dark = () => <EpisodeVideo dark={true} />;
export const Ep43Light = () => <EpisodeVideo dark={false} />;
