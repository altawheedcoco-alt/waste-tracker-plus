import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S4Background, S4Header, S4Outro, S4Feature, S4Stat, S4Dashboard, GlassCard, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S4Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const pricingModels = [
    { icon: "⚖️", name: "تسعير بالوزن", en: "Per Weight", price: "250 ج.م/طن", color: C.amber },
    { icon: "🚛", name: "تسعير بالرحلة", en: "Per Trip", price: "1,500 ج.م", color: C.emerald },
    { icon: "📦", name: "تسعير بالحاوية", en: "Per Container", price: "800 ج.م", color: C.cyan },
    { icon: "📋", name: "عقود شهرية", en: "Monthly Contract", price: "متغير", color: C.indigo },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="التسعير والفوترة" titleEn="Pricing & Billing" subtitle="نماذج تسعير مرنة تناسب كل أنواع الأعمال" episodeNum={20} />
      <div style={{ display: "flex", gap: 24, marginTop: 50, justifyContent: "center" }}>
        {pricingModels.map((p, i) => {
          const s = spring({ frame: frame - 60 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              width: 220, padding: "28px 24px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>{p.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontFamily: mono, fontSize: 13, color: p.color, marginBottom: 14 }}>{p.en}</div>
              <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: p.color, padding: "8px 16px", borderRadius: 12, background: `${p.color}10` }}>{p.price}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="الفوترة التلقائية" titleEn="Automated Invoicing" episodeNum={20} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🧾" titleAr="فواتير تلقائية" titleEn="Auto Invoicing" desc="إنشاء الفواتير تلقائياً عند اكتمال الشحنة مع كل التفاصيل" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="💳" titleAr="طرق دفع متعددة" titleEn="Multiple Payment Methods" desc="تحويل بنكي، محافظ إلكترونية، دفع عند التسليم" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="📊" titleAr="فواتير مجمعة" titleEn="Aggregate Invoicing" desc="تجميع فواتير الشهر في فاتورة واحدة مع خصومات الكميات" color={C.cyan} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={120} icon="🔄" titleAr="تسويات تلقائية" titleEn="Auto Reconciliation" desc="مطابقة المدفوعات مع الفواتير تلقائياً وتسوية الفروقات" color={C.indigo} />
        </div>
        <S4Dashboard frame={frame} fps={fps} dark={dark} delay={70} title="Billing Dashboard" />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الفوترة" titleEn="Billing Analytics" episodeNum={20} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🧾" value="52K+" label="فاتورة شهرية" labelEn="Monthly Invoices" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="💰" value="8.5M" label="ج.م معاملات" labelEn="EGP Transactions" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⚡" value="<5s" label="وقت الفاتورة" labelEn="Invoice Time" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="✅" value="99.2%" label="تحصيل" labelEn="Collection Rate" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={99} size={140} color={C.amber} label="دقة الفواتير" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={97} size={140} color={C.emerald} label="التحصيل" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={95} size={140} color={C.cyan} label="رضا العملاء" dark={dark} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S4Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={540}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={540}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={20} nextTitle="Safe Disposal" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep20Dark = () => <EpisodeVideo dark={true} />;
export const Ep20Light = () => <EpisodeVideo dark={false} />;
