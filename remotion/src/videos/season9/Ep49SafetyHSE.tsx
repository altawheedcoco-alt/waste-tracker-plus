import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="السلامة المهنية" titleEn="Safety & HSE Management" subtitle="منظومة شاملة لإدارة الصحة والسلامة والبيئة في مواقع العمل" episodeNum={49} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🦺" titleAr="تقييم المخاطر" titleEn="Risk Assessment" desc="تحليل وتقييم مخاطر كل موقع عمل مع خطط استجابة وإجراءات وقائية" color={C9.olive} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🚨" titleAr="الإبلاغ عن الحوادث" titleEn="Incident Reporting" desc="نظام إبلاغ فوري عن الحوادث والإصابات مع تحقيق آلي وإجراءات تصحيحية" color={C9.rust} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔒" titleAr="معدات الحماية" titleEn="PPE Tracking" desc="متابعة معدات الحماية الشخصية — توزيع، صلاحية، استبدال تلقائي" color={C9.tactical} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📋" titleAr="تدقيق السلامة" titleEn="Safety Audits" desc="جولات تفتيشية رقمية مع قوائم فحص ذكية وتقارير امتثال فورية" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="مؤشرات السلامة" titleEn="Safety KPIs" episodeNum={49} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🦺" value="0" label="حوادث خطيرة" labelEn="Zero Fatalities" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📊" value="99.5%" label="الامتثال" labelEn="Compliance Rate" color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔒" value="100%" label="تغطية PPE" labelEn="PPE Coverage" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📋" value="<4h" label="وقت الاستجابة" labelEn="Response Time" color={C9.amber} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={49} nextTitle="Payroll & Benefits" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};
export const Ep49Dark = () => <EpisodeVideo dark={true} />;
export const Ep49Light = () => <EpisodeVideo dark={false} />;
