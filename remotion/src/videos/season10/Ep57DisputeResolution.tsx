import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="حل النزاعات" titleEn="Dispute Resolution & Arbitration" subtitle="نظام ذكي لإدارة النزاعات التجارية والتحكيم الإلكتروني" episodeNum={57} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🤝" titleAr="وساطة ذكية" titleEn="Smart Mediation" desc="نظام وساطة إلكتروني يقترح حلول عادلة بناءً على بيانات العقود والسوابق" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="⚖️" titleAr="تحكيم رقمي" titleEn="Digital Arbitration" desc="منصة تحكيم آمنة مع محكمين معتمدين وجلسات افتراضية مسجلة" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📋" titleAr="توثيق النزاعات" titleEn="Case Documentation" desc="أرشيف رقمي لكل النزاعات مع الأدلة، المراسلات، والقرارات" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تحليل النزاعات" titleEn="Dispute Analytics" desc="تحليل أسباب النزاعات المتكررة واقتراحات لمنعها مستقبلاً" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="فعالية حل النزاعات" titleEn="Resolution Efficiency" episodeNum={57} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🤝" value="90%" label="حل ودي" labelEn="Amicable Resolution" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⏱️" value="<7 أيام" label="متوسط الحل" labelEn="Avg Resolution" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💰" value="80%" label="توفير التقاضي" labelEn="Litigation Savings" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="95%" label="رضا الأطراف" labelEn="Party Satisfaction" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S10Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={57} /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep57Dark = () => <EpisodeVideo dark={true} />;
export const Ep57Light = () => <EpisodeVideo dark={false} />;
