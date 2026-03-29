import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S5Background, S5Header, S5Outro, S5Feature, S5Stat, S5AIBrain, cairo, inter, mono, C5, t5 } from "./S5Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="تحليل المستندات بالذكاء الاصطناعي" titleEn="AI Document Analysis" subtitle="استخراج البيانات والتصنيف التلقائي للوثائق" episodeNum={22} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📄" titleAr="تحليل فوري" titleEn="Instant Analysis" desc="رفع أي مستند والحصول على تحليل شامل في ثوانٍ" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="🔍" titleAr="استخراج البيانات" titleEn="Data Extraction" desc="استخراج حرفي لكل البيانات من السجلات والتراخيص والموافقات" color={C5.violet} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📊" titleAr="تقييم المخاطر" titleEn="Risk Assessment" desc="تصنيف تلقائي لمستوى المخاطرة مع توصيات الامتثال" color={C5.magenta} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="🤖" titleAr="22 قالب ذكي" titleEn="22 AI Templates" desc="توليد تقارير مهنية بنمط الراوي المحترف 3-10 صفحات" color={C5.cyan} />
        </div>
        <S5AIBrain frame={frame} fps={fps} dark={dark} delay={70} />
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t5(dark);
  const docTypes = [
    { icon: "📋", name: "سجلات تجارية", en: "Commercial Records", color: C5.electric },
    { icon: "📜", name: "تراخيص بيئية", en: "Environmental Permits", color: C5.violet },
    { icon: "✅", name: "موافقات رسمية", en: "Official Approvals", color: C5.emerald },
    { icon: "📑", name: "عقود وفواتير", en: "Contracts & Invoices", color: C5.amber },
    { icon: "🏗️", name: "تقارير فنية", en: "Technical Reports", color: C5.cyan },
    { icon: "⚖️", name: "مستندات قانونية", en: "Legal Documents", color: C5.magenta },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="أنواع المستندات المدعومة" titleEn="Supported Document Types" episodeNum={22} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {docTypes.map((d, i) => {
          const s = spring({ frame: frame - 55 - i * 15, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "30px 24px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
            }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>{d.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{d.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: d.color, letterSpacing: "0.05em" }}>{d.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات التحليل الذكي" titleEn="AI Analysis Stats" episodeNum={22} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📄" value="100K+" label="مستند تم تحليله" labelEn="Documents Analyzed" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<3s" label="زمن التحليل" labelEn="Analysis Time" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="98.5%" label="دقة الاستخراج" labelEn="Extraction Accuracy" color={C5.cyan} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🛡️" value="7" label="مصادر بيانات" labelEn="Data Sources" color={C5.magenta} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S5Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={22} nextTitle="Waste Classification" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep22Dark = () => <EpisodeVideo dark={true} />;
export const Ep22Light = () => <EpisodeVideo dark={false} />;
