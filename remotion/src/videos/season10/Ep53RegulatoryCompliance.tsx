import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S10Background, S10Header, S10Outro, S10Feature, S10Stat, C10 } from "./S10Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="الامتثال التنظيمي" titleEn="Regulatory Compliance Engine" subtitle="ضمان الالتزام بالقوانين البيئية المحلية والدولية تلقائياً" episodeNum={53} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S10Feature frame={frame} fps={fps} dark={dark} delay={55} icon="⚖️" titleAr="قاعدة القوانين" titleEn="Law Database" desc="قاعدة بيانات محدثة لجميع القوانين واللوائح البيئية — محلية، إقليمية، دولية" color={C10.navy} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔍" titleAr="فحص الامتثال" titleEn="Compliance Check" desc="فحص تلقائي مستمر لمدى التزام العمليات بالمعايير مع تنبيهات المخالفات" color={C10.royal} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📋" titleAr="التراخيص" titleEn="License Management" desc="متابعة التراخيص والتصاريح — تواريخ الانتهاء، التجديد، الشروط" color={C10.gold} />
      <S10Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تقارير الامتثال" titleEn="Compliance Reports" desc="تقارير جاهزة للجهات الرقابية بصيغ معتمدة مع توقيع رقمي" color={C10.slate} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S10Header frame={frame} fps={fps} dark={dark} titleAr="مؤشرات الامتثال" titleEn="Compliance KPIs" episodeNum={53} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S10Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⚖️" value="99.8%" label="نسبة الامتثال" labelEn="Compliance Rate" color={C10.navy} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔍" value="24/7" label="مراقبة مستمرة" labelEn="Continuous Monitor" color={C10.royal} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📋" value="0" label="مخالفات" labelEn="Zero Violations" color={C10.gold} />
      <S10Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="Auto" label="تقارير آلية" labelEn="Auto Reports" color={C10.slate} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S10Outro frame={0} fps={30} dark={dark} episodeNum={53} nextTitle="Audit Trail" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S10Background>
);};
export const Ep53Dark = () => <EpisodeVideo dark={true} />;
export const Ep53Light = () => <EpisodeVideo dark={false} />;
