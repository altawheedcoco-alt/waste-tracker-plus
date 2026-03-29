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

  const steps = [
    { icon: "📋", label: "تسجيل الشحنة", en: "Register", color: C.amber },
    { icon: "🔬", label: "فحص وتصنيف", en: "Inspect", color: C.emerald },
    { icon: "♻️", label: "معالجة آمنة", en: "Process", color: C.cyan },
    { icon: "📄", label: "شهادة تخلص", en: "Certificate", color: C.teal },
    { icon: "✅", label: "توثيق نهائي", en: "Archive", color: C.indigo },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="شهادات التخلص الآمن" titleEn="Safe Disposal Certificates" subtitle="توثيق كامل لعملية التخلص الآمن من المخلفات" episodeNum={21} />
      <div style={{ display: "flex", gap: 20, marginTop: 60, justifyContent: "center" }}>
        {steps.map((s, i) => {
          const sp = spring({ frame: frame - 60 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 120, padding: "22px 16px", borderRadius: 16, textAlign: "center",
                background: th.card, border: `1px solid ${s.color}30`,
                opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [40, 0])}px)`,
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text }}>{s.label}</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: s.color, marginTop: 4 }}>{s.en}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 24, height: 2, background: `${s.color}30`, opacity: sp }} />
              )}
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
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="محتوى الشهادة" titleEn="Certificate Contents" episodeNum={21} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🏭" titleAr="بيانات المنشأة" titleEn="Facility Data" desc="اسم وترخيص المنشأة المولّدة والمنشأة المعالجة مع أرقام السجل" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="🏷️" titleAr="تفاصيل المخلفات" titleEn="Waste Details" desc="النوع والكمية وفئة الخطورة وطريقة المعالجة المستخدمة" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="📍" titleAr="تتبع سلسلة الحيازة" titleEn="Chain of Custody" desc="مسار كامل من المصدر حتى المعالجة النهائية مع أختام زمنية" color={C.cyan} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={120} icon="🔒" titleAr="ختم رقمي" titleEn="Digital Seal" desc="شهادة موقعة إلكترونياً مع رمز QR للتحقق الفوري" color={C.indigo} />
        </div>
        <GlassCard frame={frame} fps={fps} dark={dark} delay={80} style={{ width: 380 }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: C.teal, marginBottom: 16 }}>📄 CERTIFICATE PREVIEW</div>
          <div style={{ fontFamily: cairo, fontSize: 22, color: t(dark).text, marginBottom: 16, textAlign: "center" }}>شهادة التخلص الآمن</div>
          <div style={{ textAlign: "center", fontSize: 48, marginBottom: 16 }}>✅</div>
          {[
            { label: "رقم الشهادة", value: "SDC-2024-48521" },
            { label: "نوع المخلفات", value: "صناعية — فئة B" },
            { label: "الكمية", value: "24.5 طن" },
            { label: "طريقة المعالجة", value: "إعادة تدوير" },
            { label: "تاريخ الإصدار", value: "2024/03/15" },
          ].map((r, i) => {
            const s = spring({ frame: frame - 100 - i * 10, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, opacity: s }}>
                <span style={{ fontFamily: cairo, fontSize: 15, color: t(dark).muted }}>{r.label}</span>
                <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: t(dark).text }}>{r.value}</span>
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
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات التخلص الآمن" titleEn="Safe Disposal Metrics" episodeNum={21} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📄" value="35K+" label="شهادة صادرة" labelEn="Certificates" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="♻️" value="92%" label="نسبة التدوير" labelEn="Recycling Rate" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔒" value="100%" label="موثق رقمياً" labelEn="Digitally Verified" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🌍" value="45K" label="طن CO₂ موفر" labelEn="CO₂ Saved" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={100} size={140} color={C.amber} label="التوثيق الرقمي" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={92} size={140} color={C.emerald} label="إعادة التدوير" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={98} size={140} color={C.cyan} label="الامتثال البيئي" dark={dark} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={21} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep21Dark = () => <EpisodeVideo dark={true} />;
export const Ep21Light = () => <EpisodeVideo dark={false} />;
