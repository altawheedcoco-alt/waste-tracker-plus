import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="التأمين والمسؤولية" titleEn="Insurance & Liability Coverage" subtitle="إدارة شاملة لبوالص التأمين والمسؤولية القانونية" episodeNum={56} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🛡️" titleAr="إدارة البوالص" titleEn="Policy Management" desc="تتبع كل بوالص التأمين — مركبات، مواقع، مسؤولية مدنية — مع تجديد تلقائي" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📋" titleAr="المطالبات" titleEn="Claims Processing" desc="تقديم ومتابعة مطالبات التأمين رقمياً مع توثيق كامل وتتبع حالة" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="⚖️" titleAr="تقييم المخاطر" titleEn="Risk Assessment" desc="تحليل المخاطر التأمينية بالذكاء الاصطناعي لتحسين التغطية وتقليل الأقساط" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تقارير التأمين" titleEn="Insurance Analytics" desc="لوحة تحكم شاملة — تكاليف الأقساط، نسبة المطالبات، تحليل الحوادث" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="أرقام التأمين" titleEn="Insurance Metrics" episodeNum={56} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🛡️" value="100%" label="تغطية شاملة" labelEn="Full Coverage" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📋" value="<48h" label="معالجة المطالبات" labelEn="Claim Processing" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💰" value="25%" label="توفير الأقساط" labelEn="Premium Savings" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="Real-time" label="تتبع حي" labelEn="Live Tracking" color={C10.slate} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={56} nextTitle="Dispute Resolution" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep56Dark = () => <EpisodeVideo dark={true} />;
export const Ep56Light = () => <EpisodeVideo dark={false} />;
