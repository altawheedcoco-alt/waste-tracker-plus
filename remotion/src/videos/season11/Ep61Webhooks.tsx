import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S11Background, S11Header, S11Outro, S11Feature, S11Stat, C11 } from "./S11Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="محرك Webhooks" titleEn="Webhook & Event Engine" subtitle="نظام أحداث قوي يربط iRecycle بأي نظام خارجي تلقائياً" episodeNum={61} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S11Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🔔" titleAr="أحداث فورية" titleEn="Real-time Events" desc="إرسال فوري عند أي حدث — شحنة جديدة، تغيير حالة، دفعة مستلمة" color={C11.nebula} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔗" titleAr="Webhook Builder" titleEn="Visual Builder" desc="منشئ بصري للـ Webhooks — اختر الحدث، حدد الوجهة، خصص البيانات" color={C11.cosmic} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔄" titleAr="إعادة المحاولة" titleEn="Auto Retry" desc="إعادة إرسال تلقائية عند الفشل مع نمط Exponential Backoff" color={C11.stellar} />
      <S11Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="لوحة المراقبة" titleEn="Monitoring Dashboard" desc="مراقبة كل الأحداث المرسلة — نجاح، فشل، زمن الاستجابة" color={C11.plasma} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S11Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الأحداث" titleEn="Event Engine Stats" episodeNum={61} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S11Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔔" value="1M+" label="حدث يومياً" labelEn="Daily Events" color={C11.nebula} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<50ms" label="زمن الإرسال" labelEn="Delivery Time" color={C11.cosmic} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={80} icon="✅" value="99.99%" label="نسبة النجاح" labelEn="Success Rate" color={C11.stellar} />
      <S11Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔄" value="Auto" label="إعادة تلقائية" labelEn="Auto Retry" color={C11.plasma} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S11Outro frame={0} fps={30} dark={dark} episodeNum={61} nextTitle="Open API Marketplace" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S11Background>
);};
export const Ep61Dark = () => <EpisodeVideo dark={true} />;
export const Ep61Light = () => <EpisodeVideo dark={false} />;
