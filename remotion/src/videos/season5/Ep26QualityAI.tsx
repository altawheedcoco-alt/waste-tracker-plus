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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="فحص الجودة بالذكاء الاصطناعي" titleEn="AI Quality Inspection" subtitle="رؤية حاسوبية لضمان جودة المواد والشحنات" episodeNum={26} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🔬" titleAr="فحص بصري ذكي" titleEn="Visual Inspection" desc="كاميرا ذكية تفحص جودة المواد وتكشف التلوث والشوائب" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="📊" titleAr="تقرير جودة آلي" titleEn="Auto Quality Report" desc="تقارير مفصلة بنسب النقاء والتلوث مع صور موثقة" color={C5.violet} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="⚡" titleAr="كشف آلي للعيوب" titleEn="Defect Detection" desc="كشف العيوب والمواد الدخيلة قبل المعالجة بنسبة خطأ أقل من 2%" color={C5.emerald} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📱" titleAr="فحص ميداني" titleEn="Field Inspection" desc="الفحص من أي موقع عبر كاميرا الهاتف مع نتائج فورية" color={C5.cyan} />
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
  const stages = [
    { icon: "📸", step: "01", name: "التصوير", en: "Capture", desc: "التقاط صورة للمادة", color: C5.electric },
    { icon: "🧠", step: "02", name: "التحليل", en: "Analyze", desc: "AI يحلل الصورة", color: C5.violet },
    { icon: "📋", step: "03", name: "التقييم", en: "Grade", desc: "تصنيف مستوى الجودة", color: C5.emerald },
    { icon: "✅", step: "04", name: "القرار", en: "Decision", desc: "قبول أو رفض الشحنة", color: C5.cyan },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="مراحل الفحص الذكي" titleEn="Smart Inspection Pipeline" episodeNum={26} />
      <div style={{ display: "flex", gap: 30, marginTop: 70, justifyContent: "center", alignItems: "center" }}>
        {stages.map((st, i) => {
          const s = spring({ frame: frame - 55 - i * 20, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <React.Fragment key={i}>
              <div style={{
                width: 220, padding: "32px 20px", borderRadius: 20, textAlign: "center",
                background: th.card, border: `1px solid ${th.borderSoft}`,
                opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              }}>
                <div style={{ fontFamily: mono, fontSize: 14, color: st.color, marginBottom: 12 }}>STEP {st.step}</div>
                <div style={{ fontSize: 44, marginBottom: 14 }}>{st.icon}</div>
                <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{st.name}</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: st.color, marginBottom: 10 }}>{st.en}</div>
                <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted }}>{st.desc}</div>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  fontFamily: mono, fontSize: 24, color: th.muted,
                  opacity: spring({ frame: frame - 75 - i * 20, fps, config: { damping: 20 } }),
                }}>→</div>
              )}
            </React.Fragment>
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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="نتائج الفحص الذكي" titleEn="Quality AI Results" episodeNum={26} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔬" value="200K+" label="فحص منجز" labelEn="Inspections Done" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<5s" label="زمن الفحص" labelEn="Inspection Time" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="98%" label="دقة الكشف" labelEn="Detection Accuracy" color={C5.emerald} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💰" value="60%" label="توفير الفرز اليدوي" labelEn="Manual Sort Savings" color={C5.amber} />
      </div>
    </AbsoluteFill>
  );
};

import React from "react";

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
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={26} nextTitle="Strategic AI" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep26Dark = () => <EpisodeVideo dark={true} />;
export const Ep26Light = () => <EpisodeVideo dark={false} />;
