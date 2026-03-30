import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="المحفظة الرقمية" titleEn="Digital Wallet & Payments" subtitle="محفظة إلكترونية متكاملة للسائقين والعملاء والشركاء" episodeNum={44} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="👛" titleAr="رصيد فوري" titleEn="Instant Balance" desc="رصيد حي يتحدث لحظياً مع كل معاملة — إيداع، سحب، تحويل" color={C8.gold} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="📲" titleAr="تحويلات سريعة" titleEn="Quick Transfers" desc="تحويل بين المحافظ داخل النظام فوراً بدون رسوم إضافية" color={C8.amber} />
      <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🏧" titleAr="سحب للبنك" titleEn="Bank Withdrawal" desc="طلب سحب مباشر للحساب البنكي — معالجة آلية خلال ٢٤ ساعة" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات المحفظة" titleEn="Wallet Stats" episodeNum={44} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="👛" value="Real" label="رصيد حي" labelEn="Live Balance" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📲" value="0%" label="رسوم تحويل" labelEn="Transfer Fee" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🏧" value="24h" label="وقت السحب" labelEn="Withdrawal Time" color={C8.emerald} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S8Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={44} nextTitle="Financial Reports" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};
export const Ep44Dark = () => <EpisodeVideo dark={true} />;
export const Ep44Light = () => <EpisodeVideo dark={false} />;
