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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="التحليل الاستراتيجي بالذكاء الاصطناعي" titleEn="AI Strategic Analysis" subtitle="رؤى استراتيجية عميقة من 7 مصادر بيانات" episodeNum={27} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🏢" titleAr="تحليل المنظمة" titleEn="Deep Org Analysis" desc="تقرير استراتيجي شامل يحلل أداء المنظمة من كل الزوايا" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="📊" titleAr="7 مصادر بيانات" titleEn="7 Data Sources" desc="شحنات، مالية، أسطول، عمالة، جودة، امتثال، عملاء" color={C5.violet} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="⚠️" titleAr="تصنيف المخاطر" titleEn="Risk Classification" desc="تصنيف آلي لمستوى المخاطرة (منخفض/متوسط/عالي/حرج)" color={C5.magenta} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="💡" titleAr="توصيات ذكية" titleEn="Smart Recommendations" desc="توصيات عملية قابلة للتنفيذ مع أولويات وجدول زمني" color={C5.emerald} />
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
  const sources = [
    { icon: "📦", name: "الشحنات", en: "Shipments", color: C5.electric },
    { icon: "💰", name: "المالية", en: "Finance", color: C5.amber },
    { icon: "🚛", name: "الأسطول", en: "Fleet", color: C5.emerald },
    { icon: "👷", name: "العمالة", en: "Workforce", color: C5.violet },
    { icon: "🔬", name: "الجودة", en: "Quality", color: C5.cyan },
    { icon: "📋", name: "الامتثال", en: "Compliance", color: C5.magenta },
    { icon: "👥", name: "العملاء", en: "Customers", color: C5.electric },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="مصادر البيانات الاستراتيجية" titleEn="Strategic Data Sources" episodeNum={27} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 60, justifyContent: "center" }}>
        {sources.map((src, i) => {
          const s = spring({ frame: frame - 55 - i * 12, fps, config: { damping: 18, stiffness: 160 } });
          const pulse = 0.95 + Math.sin(frame * 0.04 + i) * 0.05;
          return (
            <div key={i} style={{
              width: 180, padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${src.color}20`,
              opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.8, pulse])})`,
              boxShadow: dark ? `0 0 20px ${src.color}10` : "none",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{src.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 4 }}>{src.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: src.color }}>{src.en}</div>
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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="نتائج التحليل الاستراتيجي" titleEn="Strategic Analysis Results" episodeNum={27} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏢" value="5K+" label="تقرير استراتيجي" labelEn="Strategic Reports" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<30s" label="زمن التقرير" labelEn="Report Time" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📊" value="7" label="مصدر بيانات" labelEn="Data Sources" color={C5.emerald} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🎯" value="92%" label="دقة التوصيات" labelEn="Recommendation Accuracy" color={C5.magenta} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={27} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep27Dark = () => <EpisodeVideo dark={true} />;
export const Ep27Light = () => <EpisodeVideo dark={false} />;
