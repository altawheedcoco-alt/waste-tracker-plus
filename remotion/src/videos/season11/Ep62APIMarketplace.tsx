import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="سوق التطبيقات" titleEn="Open API Marketplace" subtitle="سوق تطبيقات مفتوح يتيح للمطورين بناء حلول متكاملة" episodeNum={62} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🛒" titleAr="متجر التطبيقات" titleEn="App Store" desc="سوق مركزي لتطبيقات وإضافات إدارة المخلفات — تثبيت بنقرة واحدة" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="👨‍💻" titleAr="أدوات المطورين" titleEn="Developer Tools" desc="SDK شامل، وثائق تفاعلية، بيئة اختبار، ودعم فني للمطورين" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔌" titleAr="إضافات جاهزة" titleEn="Ready Plugins" desc="مكتبة إضافات جاهزة — محاسبة، CRM، إدارة المستودعات، وأكثر" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="💰" titleAr="نموذج الإيرادات" titleEn="Revenue Sharing" desc="نظام مشاركة إيرادات عادل يحفز المطورين على بناء حلول مبتكرة" color={C11.supernova} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="أرقام السوق" titleEn="Marketplace Numbers" episodeNum={62} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🛒" value="200+" label="تطبيق متاح" labelEn="Available Apps" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="👨‍💻" value="1K+" label="مطور نشط" labelEn="Active Developers" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="RESTful" label="API معياري" labelEn="Standard API" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔐" value="OAuth2" label="مصادقة آمنة" labelEn="Secure Auth" color={C11.supernova} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={62} nextTitle="Multi-tenant Architecture" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep62Dark = () => <EpisodeVideo dark={true} />;
export const Ep62Light = () => <EpisodeVideo dark={false} />;
