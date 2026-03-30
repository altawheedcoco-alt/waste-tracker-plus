import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="الخرائط ونظم GIS" titleEn="Maps & GIS Platform" subtitle="نظام معلومات جغرافية متكامل لإدارة المواقع والمسارات" episodeNum={60} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🗺️" titleAr="خرائط حية" titleEn="Live Maps" desc="خريطة تفاعلية ثلاثية الأبعاد تعرض المواقع، المركبات، والحاويات لحظياً" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📍" titleAr="إدارة المواقع" titleEn="Site Management" desc="تحديد وإدارة مواقع الجمع والمعالجة مع حدود جغرافية ذكية (Geofencing)" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🛣️" titleAr="تحليل المسارات" titleEn="Route Analysis" desc="تحليل كثافة المسارات، نقاط الازدحام، وتحسين الشبكة اللوجستية" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="خرائط حرارية" titleEn="Heat Maps" desc="خرائط حرارية لكثافة النفايات وأنماط الطلب عبر المناطق الجغرافية" color={C11.aurora} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات GIS" titleEn="GIS Metrics" episodeNum={60} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🗺️" value="3D" label="خرائط ثلاثية" labelEn="3D Maps" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📍" value="10K+" label="موقع مسجل" labelEn="Registered Sites" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🛣️" value="35%" label="تحسين المسارات" labelEn="Route Optimization" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="Live" label="بيانات حية" labelEn="Real-time Data" color={C11.aurora} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={60} nextTitle="Webhook Engine" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep60Dark = () => <EpisodeVideo dark={true} />;
export const Ep60Light = () => <EpisodeVideo dark={false} />;
