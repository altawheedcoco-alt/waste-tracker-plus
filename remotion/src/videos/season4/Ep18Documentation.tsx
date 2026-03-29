import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S4Background, S4Header, S4Outro, S4Feature, S4Stat, GlassCard, ProgressRing, cairo, inter, mono, C, t } from "./S4Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const docs = [
    { icon: "📋", name: "بوليصة الشحن", en: "Bill of Lading", status: "تلقائي", color: C.emerald },
    { icon: "📄", name: "بيان المخلفات", en: "Waste Manifest", status: "تلقائي", color: C.amber },
    { icon: "⚖️", name: "شهادة الوزن", en: "Weight Certificate", status: "فوري", color: C.cyan },
    { icon: "✅", name: "تقرير الجودة", en: "Quality Report", status: "AI", color: C.indigo },
    { icon: "🔒", name: "شهادة التخلص الآمن", en: "Safe Disposal Cert.", status: "تلقائي", color: C.teal },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="التوثيق والمستندات" titleEn="Documentation & Certificates" subtitle="كل مستند تحتاجه — يُنشأ تلقائياً ويُحفظ رقمياً" episodeNum={18} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 50 }}>
        {docs.map((d, i) => {
          const s = spring({ frame: frame - 60 - i * 16, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              display: "flex", gap: 20, alignItems: "center", padding: "18px 28px",
              background: th.card, border: `1px solid ${th.borderSoft}`, borderRadius: 14,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 32 }}>{d.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text }}>{d.name}</div>
                <div style={{ fontFamily: mono, fontSize: 13, color: d.color }}>{d.en}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 14, color: d.color, padding: "6px 16px", borderRadius: 12, background: `${d.color}12`, border: `1px solid ${d.color}20` }}>{d.status}</div>
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
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إنشاء المستندات بالذكاء الاصطناعي" titleEn="AI Document Generation" episodeNum={18} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🤖" titleAr="توليد تلقائي للعقود" titleEn="Auto Contract Generation" desc="الذكاء الاصطناعي يُنشئ عقود النقل والمعالجة حسب نوع المخلفات" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="✍️" titleAr="توقيع إلكتروني" titleEn="Digital Signature" desc="توقيع المستندات إلكترونياً مع ختم زمني وتشفير متقدم" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="📁" titleAr="أرشفة ذكية" titleEn="Smart Archival" desc="حفظ وتنظيم آلي لجميع المستندات مع بحث نصي كامل" color={C.cyan} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={120} icon="📤" titleAr="مشاركة آمنة" titleEn="Secure Sharing" desc="مشاركة المستندات مع الجهات المعنية برابط مؤقت وصلاحيات محددة" color={C.indigo} />
        </div>
        <GlassCard frame={frame} fps={fps} dark={dark} delay={80} style={{ width: 380 }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: C.amber, marginBottom: 16 }}>📄 DOCUMENT PREVIEW</div>
          <div style={{ fontFamily: cairo, fontSize: 20, color: t(dark).text, marginBottom: 12 }}>بوليصة شحن #BL-4521</div>
          {[
            { label: "المرسل", value: "مصنع الحديد والصلب" },
            { label: "المستلم", value: "مصنع إعادة التدوير" },
            { label: "النوع", value: "خردة حديد — Grade A" },
            { label: "الوزن", value: "24.5 طن" },
            { label: "الحالة", value: "✅ موقّع رقمياً" },
          ].map((r, i) => {
            const s = spring({ frame: frame - 100 - i * 10, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, opacity: s }}>
                <span style={{ fontFamily: cairo, fontSize: 15, color: t(dark).muted }}>{r.label}</span>
                <span style={{ fontFamily: cairo, fontSize: 15, fontWeight: 700, color: t(dark).text }}>{r.value}</span>
              </div>
            );
          })}
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات التوثيق" titleEn="Documentation Metrics" episodeNum={18} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📄" value="180K+" label="مستند مُنشأ" labelEn="Generated" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="✍️" value="95K" label="توقيع إلكتروني" labelEn="E-Signatures" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⏱️" value="<30s" label="وقت الإنشاء" labelEn="Generation Time" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🔒" value="100%" label="مؤمّن" labelEn="Encrypted" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={99} size={140} color={C.amber} label="دقة المستندات" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={96} size={140} color={C.emerald} label="توافق قانوني" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={100} size={140} color={C.cyan} label="تشفير البيانات" dark={dark} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={18} nextTitle="Weighbridge" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep18Dark = () => <EpisodeVideo dark={true} />;
export const Ep18Light = () => <EpisodeVideo dark={false} />;
