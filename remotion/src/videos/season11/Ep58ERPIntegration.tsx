import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="تكامل ERP" titleEn="ERP & Enterprise Integration" subtitle="ربط سلس مع أنظمة SAP وOracle وMicrosoft Dynamics" episodeNum={58} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🔗" titleAr="ربط SAP" titleEn="SAP Integration" desc="تكامل ثنائي الاتجاه مع SAP — أوامر الشراء، الفواتير، المخزون، التقارير" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🏢" titleAr="Oracle ERP" titleEn="Oracle Cloud" desc="ربط مع Oracle Cloud — المحاسبة، سلسلة التوريد، إدارة المشاريع" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📊" titleAr="Microsoft Dynamics" titleEn="Dynamics 365" desc="تكامل مع Dynamics 365 — CRM، المالية، سلسلة التوريد" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔄" titleAr="مزامنة حية" titleEn="Real-time Sync" desc="مزامنة فورية ثنائية الاتجاه مع معالجة الأخطاء التلقائية" color={C11.plasma} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="أرقام التكامل" titleEn="Integration Stats" episodeNum={58} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔗" value="50+" label="نظام متصل" labelEn="Connected Systems" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔄" value="<100ms" label="وقت المزامنة" labelEn="Sync Latency" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="99.9%" label="وقت التشغيل" labelEn="Uptime" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔐" value="OAuth2" label="مصادقة آمنة" labelEn="Secure Auth" color={C11.plasma} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={58} nextTitle="Government Portals" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep58Dark = () => <EpisodeVideo dark={true} />;
export const Ep58Light = () => <EpisodeVideo dark={false} />;
