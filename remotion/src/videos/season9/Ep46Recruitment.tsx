import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="التوظيف الذكي" titleEn="Smart Recruitment & Hiring" subtitle="نظام توظيف متكامل يربط المنشآت بالكفاءات المتخصصة في إدارة المخلفات" episodeNum={46} />
    <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📋" titleAr="نشر الوظائف" titleEn="Job Posting" desc="إنشاء إعلانات وظيفية مخصصة لقطاع إدارة المخلفات مع متطلبات دقيقة" color={C9.olive} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🎯" titleAr="مطابقة المرشحين" titleEn="Candidate Matching" desc="خوارزمية ذكية تطابق المرشحين مع الوظائف بناءً على المهارات والخبرة" color={C9.khaki} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📊" titleAr="تقييم الأداء" titleEn="Performance Assessment" desc="اختبارات عملية ونظرية لتقييم كفاءة المرشحين قبل التعيين" color={C9.tactical} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📝" titleAr="العقود الرقمية" titleEn="Digital Contracts" desc="إصدار عقود إلكترونية موقعة رقمياً مع شروط واضحة ومتابعة تلقائية" color={C9.amber} />
      </div>
    </div>
  </AbsoluteFill>
);};

const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="أرقام التوظيف" titleEn="Recruitment Metrics" episodeNum={46} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📋" value="500+" label="وظيفة نشطة" labelEn="Active Jobs" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🎯" value="85%" label="دقة المطابقة" labelEn="Match Accuracy" color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⏱️" value="3 أيام" label="متوسط التوظيف" labelEn="Avg Hire Time" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📈" value="92%" label="رضا الموظفين" labelEn="Satisfaction" color={C9.amber} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={46} nextTitle="Training Academy" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};

export const Ep46Dark = () => <EpisodeVideo dark={true} />;
export const Ep46Light = () => <EpisodeVideo dark={false} />;
