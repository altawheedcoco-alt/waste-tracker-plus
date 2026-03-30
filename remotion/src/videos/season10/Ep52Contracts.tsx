import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="العقود الرقمية" titleEn="Digital Contract Management" subtitle="إدارة شاملة لدورة حياة العقود — من الصياغة حتى التجديد" episodeNum={52} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📝" titleAr="صياغة ذكية" titleEn="Smart Drafting" desc="قوالب عقود جاهزة لقطاع إدارة المخلفات — خدمات، نقل، معالجة، شراكات" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="✍️" titleAr="التوقيع الإلكتروني" titleEn="E-Signatures" desc="توقيع إلكتروني معتمد قانونياً مع مصادقة متعددة العوامل" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔔" titleAr="تنبيهات التجديد" titleEn="Renewal Alerts" desc="تنبيهات استباقية قبل انتهاء العقود مع تجديد تلقائي حسب الشروط" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تحليل العقود" titleEn="Contract Analytics" desc="تحليل أداء العقود — قيمة، مدة، التزام الأطراف، مخاطر" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="كفاءة العقود" titleEn="Contract Metrics" episodeNum={52} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📝" value="100%" label="رقمنة كاملة" labelEn="Fully Digital" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="✍️" value="<5min" label="وقت التوقيع" labelEn="Sign Time" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔔" value="0%" label="عقود منسية" labelEn="Zero Missed" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="60%" label="توفير الوقت" labelEn="Time Saved" color={C10.slate} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={52} nextTitle="Regulatory Compliance" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep52Dark = () => <EpisodeVideo dark={true} />;
export const Ep52Light = () => <EpisodeVideo dark={false} />;
