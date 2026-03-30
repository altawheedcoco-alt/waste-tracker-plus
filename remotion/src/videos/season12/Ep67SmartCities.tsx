import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12 } from "./S12Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="المدن الذكية" titleEn="Smart City Integration" subtitle="iRecycle كعمود فقري لإدارة المخلفات في مدن المستقبل" episodeNum={67} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S12Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🏙️" titleAr="شبكة المدينة" titleEn="City Network" desc="ربط مع منصة المدينة الذكية — إشارات المرور، الإنارة، المراقبة البيئية" color={C12.prism} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🗣️" titleAr="مشاركة المواطنين" titleEn="Citizen Engagement" desc="تطبيق للمواطنين للإبلاغ عن المخلفات وتتبع أثرهم البيئي" color={C12.mint} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📊" titleAr="لوحة المدينة" titleEn="City Dashboard" desc="لوحة تحكم موحدة لصناع القرار تعرض حالة نظافة المدينة لحظياً" color={C12.holo} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🌱" titleAr="تأثير بيئي" titleEn="Green Impact" desc="قياس الأثر البيئي على مستوى المدينة — جودة الهواء، المياه، التربة" color={C12.ice} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="أرقام المدينة الذكية" titleEn="Smart City Impact" episodeNum={67} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏙️" value="20+" label="مدينة ذكية" labelEn="Smart Cities" color={C12.prism} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🗣️" value="1M+" label="مواطن مشارك" labelEn="Active Citizens" color={C12.mint} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="Real-time" label="بيانات حية" labelEn="Live Data" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🌱" value="45%" label="تحسن بيئي" labelEn="Green Improvement" color={C12.ice} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S12Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S12Outro frame={0} fps={30} dark={dark} episodeNum={67} nextTitle="Quantum Computing" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};
export const Ep67Dark = () => <EpisodeVideo dark={true} />;
export const Ep67Light = () => <EpisodeVideo dark={false} />;
