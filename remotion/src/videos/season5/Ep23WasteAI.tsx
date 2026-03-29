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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="تصنيف النفايات بالذكاء الاصطناعي" titleEn="AI Waste Classification" subtitle="كاميرا ذكية تتعرف على أنواع النفايات تلقائياً" episodeNum={23} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📸" titleAr="تصوير وتصنيف" titleEn="Snap & Classify" desc="التقط صورة للنفايات واحصل على التصنيف الصحيح فوراً" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="♻️" titleAr="120+ نوع نفايات" titleEn="120+ Waste Types" desc="قاعدة بيانات شاملة تغطي كل أنواع النفايات الصناعية والطبية" color={C5.emerald} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="⚠️" titleAr="تحذيرات السلامة" titleEn="Safety Alerts" desc="تنبيهات فورية للنفايات الخطرة مع إرشادات التعامل" color={C5.magenta} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="💰" titleAr="تقدير القيمة" titleEn="Value Estimation" desc="تقدير تلقائي لقيمة المواد القابلة لإعادة التدوير" color={C5.amber} />
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
  const wasteTypes = [
    { icon: "🔩", name: "معادن", en: "Metals", pct: 95, color: C5.electric },
    { icon: "📦", name: "ورق وكرتون", en: "Paper", pct: 92, color: C5.emerald },
    { icon: "🧴", name: "بلاستيك", en: "Plastics", pct: 94, color: C5.violet },
    { icon: "🏗️", name: "مخلفات بناء", en: "Construction", pct: 88, color: C5.amber },
    { icon: "🔋", name: "إلكترونيات", en: "E-Waste", pct: 96, color: C5.cyan },
    { icon: "☣️", name: "نفايات خطرة", en: "Hazardous", pct: 99, color: C5.magenta },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="دقة التصنيف حسب النوع" titleEn="Classification Accuracy" episodeNum={23} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 50 }}>
        {wasteTypes.map((w, i) => {
          const s = spring({ frame: frame - 55 - i * 12, fps, config: { damping: 18 } });
          const barW = interpolate(s, [0, 1], [0, w.pct]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: s }}>
              <div style={{ fontSize: 32, width: 50 }}>{w.icon}</div>
              <div style={{ width: 140, fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text }}>{w.name}</div>
              <div style={{ flex: 1, height: 36, borderRadius: 18, background: th.card, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${barW}%`, height: "100%", borderRadius: 18,
                  background: `linear-gradient(90deg, ${w.color}40, ${w.color})`,
                  boxShadow: dark ? `0 0 15px ${w.color}30` : "none",
                }} />
                <div style={{
                  position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                  fontFamily: mono, fontSize: 14, fontWeight: 700, color: th.text,
                }}>{w.pct}%</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, color: w.color, width: 100 }}>{w.en}</div>
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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="تأثير التصنيف الذكي" titleEn="Smart Classification Impact" episodeNum={23} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📸" value="500K+" label="صورة مصنفة" labelEn="Images Classified" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<1s" label="زمن التصنيف" labelEn="Classification Time" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="94%" label="دقة عامة" labelEn="Overall Accuracy" color={C5.emerald} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💰" value="40%" label="توفير في الفرز" labelEn="Sorting Savings" color={C5.amber} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={23} nextTitle="iRecycle Health" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep23Dark = () => <EpisodeVideo dark={true} />;
export const Ep23Light = () => <EpisodeVideo dark={false} />;
