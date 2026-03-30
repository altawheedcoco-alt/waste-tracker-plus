import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="سجل التدقيق" titleEn="Audit Trail & Evidence Chain" subtitle="سجل رقمي غير قابل للتلاعب لكل عملية ومعاملة في النظام" episodeNum={54} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🔗" titleAr="سلسلة الأدلة" titleEn="Evidence Chain" desc="تسجيل كل إجراء مع الطابع الزمني والمستخدم والجهاز — غير قابل للحذف" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔍" titleAr="بحث متقدم" titleEn="Advanced Search" desc="بحث في ملايين السجلات بالتاريخ، المستخدم، نوع العملية، أو الكلمات المفتاحية" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📊" titleAr="تحليل الأنماط" titleEn="Pattern Analysis" desc="كشف الأنماط غير المعتادة والسلوكيات المشبوهة بالذكاء الاصطناعي" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📄" titleAr="تقارير التدقيق" titleEn="Audit Reports" desc="تقارير تدقيق مفصلة جاهزة للمراجعين الداخليين والخارجيين" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="أرقام التدقيق" titleEn="Audit Numbers" episodeNum={54} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔗" value="100%" label="تغطية شاملة" labelEn="Full Coverage" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔍" value="<1s" label="وقت البحث" labelEn="Search Time" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="AI" label="كشف المخالفات" labelEn="AI Detection" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📄" value="7 سنوات" label="فترة الحفظ" labelEn="Retention" color={C10.slate} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={54} nextTitle="Data Privacy" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep54Dark = () => <EpisodeVideo dark={true} />;
export const Ep54Light = () => <EpisodeVideo dark={false} />;
