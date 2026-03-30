import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="حماية البيانات" titleEn="Data Privacy & GDPR" subtitle="حماية شاملة للبيانات الشخصية وفقاً للمعايير الدولية" episodeNum={55} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🔐" titleAr="تشفير البيانات" titleEn="Data Encryption" desc="تشفير AES-256 لكل البيانات في الحفظ والنقل مع إدارة مفاتيح آمنة" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="👤" titleAr="حقوق المستخدم" titleEn="User Rights" desc="الحق في الوصول، التعديل، الحذف، ونقل البيانات الشخصية" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🛡️" titleAr="اتفاقيات الخصوصية" titleEn="Privacy Agreements" desc="سياسات خصوصية واضحة مع موافقة صريحة وإدارة التفضيلات" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📋" titleAr="تقييم الأثر" titleEn="DPIA Assessment" desc="تقييم أثر حماية البيانات لكل عملية معالجة جديدة" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="معايير الخصوصية" titleEn="Privacy Standards" episodeNum={55} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔐" value="AES-256" label="معيار التشفير" labelEn="Encryption" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🛡️" value="GDPR" label="امتثال أوروبي" labelEn="EU Compliant" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="👤" value="<24h" label="وقت الاستجابة" labelEn="Response Time" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📋" value="ISO 27001" label="شهادة أمان" labelEn="Certified" color={C10.slate} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={55} nextTitle="Insurance & Liability" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep55Dark = () => <EpisodeVideo dark={true} />;
export const Ep55Light = () => <EpisodeVideo dark={false} />;
