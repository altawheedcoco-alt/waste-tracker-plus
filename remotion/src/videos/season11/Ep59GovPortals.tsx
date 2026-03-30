import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="البوابات الحكومية" titleEn="Government Portal Integration" subtitle="ربط مباشر مع الأنظمة الحكومية والبيئية الرقابية" episodeNum={59} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🏛️" titleAr="التقارير الحكومية" titleEn="Gov Reporting" desc="إرسال تلقائي للتقارير البيئية للجهات الرقابية بالصيغ المعتمدة" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📋" titleAr="التصاريح الإلكترونية" titleEn="E-Permits" desc="تقديم وتجديد التصاريح البيئية إلكترونياً مع متابعة الحالة" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔍" titleAr="التفتيش الرقمي" titleEn="Digital Inspection" desc="استقبال إشعارات التفتيش وإعداد الملفات المطلوبة تلقائياً" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="لوحة الامتثال" titleEn="Compliance Dashboard" desc="لوحة حية تعرض حالة الامتثال مع كل الجهات الحكومية" color={C11.supernova} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="الربط الحكومي" titleEn="Gov Integration" episodeNum={59} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏛️" value="15+" label="جهة حكومية" labelEn="Gov Agencies" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📋" value="Auto" label="تقارير آلية" labelEn="Auto Reports" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⏱️" value="0" label="تأخير" labelEn="Zero Delays" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="✅" value="100%" label="امتثال كامل" labelEn="Full Compliance" color={C11.supernova} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S11Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={59} nextTitle="Maps & GIS" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep59Dark = () => <EpisodeVideo dark={true} />;
export const Ep59Light = () => <EpisodeVideo dark={false} />;
