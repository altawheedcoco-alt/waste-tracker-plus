import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="البنية متعددة المستأجرين" titleEn="Multi-Tenant Architecture" subtitle="بنية سحابية قابلة للتوسع تخدم آلاف المنشآت بعزل كامل" episodeNum={63} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="☁️" titleAr="سحابة مرنة" titleEn="Elastic Cloud" desc="بنية Kubernetes تتوسع تلقائياً مع الطلب — من 10 إلى 10,000 مستخدم" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔒" titleAr="عزل البيانات" titleEn="Data Isolation" desc="عزل كامل لبيانات كل منشأة مع تشفير منفصل لكل مستأجر" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🌍" titleAr="مراكز بيانات" titleEn="Data Centers" desc="مراكز بيانات في مصر، السعودية، والإمارات لأقل زمن استجابة" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="مراقبة حية" titleEn="Live Monitoring" desc="مراقبة أداء كل مستأجر على حدة مع تنبيهات استباقية" color={C11.aurora} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="أرقام البنية" titleEn="Infrastructure Stats" episodeNum={63} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="☁️" value="99.99%" label="وقت التشغيل" labelEn="Uptime SLA" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔒" value="AES-256" label="تشفير البيانات" labelEn="Encryption" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🌍" value="3" label="مراكز بيانات" labelEn="Data Centers" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="⚡" value="<200ms" label="زمن الاستجابة" labelEn="Response Time" color={C11.aurora} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={63} /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep63Dark = () => <EpisodeVideo dark={true} />;
export const Ep63Light = () => <EpisodeVideo dark={false} />;
