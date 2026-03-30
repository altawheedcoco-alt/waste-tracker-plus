import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S8Background, S8Header, S8Outro, S8Feature, S8Stat, C8 } from "./S8Common";
const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="الفوترة الذكية" titleEn="Smart Invoicing & Billing" subtitle="نظام فوترة آلي متكامل مع بوابات الدفع الإلكتروني" episodeNum={40} />
    <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <S8Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🧾" titleAr="فوترة تلقائية" titleEn="Auto-Invoicing" desc="إصدار فواتير تلقائية عند اكتمال الشحنة — ضريبة، خصومات، شروط دفع" color={C8.gold} />
        <S8Feature frame={frame} fps={fps} dark={dark} delay={73} icon="💳" titleAr="بوابات الدفع" titleEn="Payment Gateways" desc="تكامل مع فوري، بايموب، فيزا — دفع إلكتروني آمن ومباشر" color={C8.amber} />
        <S8Feature frame={frame} fps={fps} dark={dark} delay={91} icon="📊" titleAr="تحليل الإيرادات" titleEn="Revenue Analytics" desc="تقارير مالية تفصيلية — تدفقات نقدية، هوامش ربح، مقارنات شهرية" color={C8.emerald} />
        <S8Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔐" titleAr="أمان مالي" titleEn="Financial Security" desc="تشفير المعاملات، تدقيق كامل، مطابقة بنكية تلقائية" color={C8.navy} />
      </div>
    </div>
  </AbsoluteFill>
);};

const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S8Header frame={frame} fps={fps} dark={dark} titleAr="أرقام مالية" titleEn="Financial Metrics" episodeNum={40} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S8Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🧾" value="99%" label="دقة الفواتير" labelEn="Invoice Accuracy" color={C8.gold} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={65} icon="💳" value="<24h" label="تحصيل سريع" labelEn="Fast Collection" color={C8.amber} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="40%" label="توفير إداري" labelEn="Admin Savings" color={C8.emerald} />
      <S8Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔐" value="PCI" label="معايير أمان" labelEn="PCI Compliant" color={C8.navy} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S8Outro frame={0} fps={30} dark={dark} episodeNum={40} nextTitle="Cost Analysis" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S8Background>
);};

export const Ep40Dark = () => <EpisodeVideo dark={true} />;
export const Ep40Light = () => <EpisodeVideo dark={false} />;
