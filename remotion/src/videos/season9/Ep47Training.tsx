import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="أكاديمية التدريب" titleEn="Training Academy & Certifications" subtitle="منصة تعليمية متكاملة لتأهيل العاملين في قطاع إدارة المخلفات" episodeNum={47} />
    <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🎓" titleAr="دورات تدريبية" titleEn="Training Courses" desc="مكتبة دورات شاملة — سلامة، تصنيف، نقل، معالجة — بشهادات معتمدة" color={C9.olive} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📱" titleAr="تعلم متنقل" titleEn="Mobile Learning" desc="تدريب ميداني عبر التطبيق — فيديوهات قصيرة، اختبارات سريعة، تقدم محفوظ" color={C9.khaki} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🏆" titleAr="شهادات معتمدة" titleEn="Certified Badges" desc="شهادات رقمية قابلة للمشاركة عبر LinkedIn مع رمز QR للتحقق" color={C9.tactical} />
        <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تتبع التقدم" titleEn="Progress Tracking" desc="لوحة تحكم للمديرين لمتابعة تقدم الفريق وتحديد فجوات المهارات" color={C9.amber} />
      </div>
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الأكاديمية" titleEn="Academy Stats" episodeNum={47} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🎓" value="120+" label="دورة تدريبية" labelEn="Courses" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="👥" value="5K+" label="متدرب" labelEn="Trainees" color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🏆" value="98%" label="نسبة النجاح" labelEn="Pass Rate" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📈" value="60%" label="تحسن الأداء" labelEn="Performance Boost" color={C9.amber} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={47} nextTitle="Shift Management" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};
export const Ep47Dark = () => <EpisodeVideo dark={true} />;
export const Ep47Light = () => <EpisodeVideo dark={false} />;
