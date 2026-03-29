import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S4Background, S4Header, S4Outro, S4Feature, S4Stat, GlassCard, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S4Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const wasteTypes = [
    { icon: "🏗️", name: "مخلفات بناء وهدم", en: "C&D Waste", percent: 35, color: C.amber },
    { icon: "🏭", name: "مخلفات صناعية", en: "Industrial", percent: 28, color: C.emerald },
    { icon: "🧪", name: "مخلفات خطرة", en: "Hazardous", percent: 12, color: C.rose },
    { icon: "♻️", name: "مخلفات قابلة للتدوير", en: "Recyclable", percent: 18, color: C.cyan },
    { icon: "🌿", name: "مخلفات عضوية", en: "Organic", percent: 7, color: C.teal },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="أنواع المخلفات والتصنيف" titleEn="Waste Types & Classification" subtitle="تصنيف دقيق حسب المعايير المصرية والدولية" episodeNum={17} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 50 }}>
        {wasteTypes.map((w, i) => {
          const s = spring({ frame: frame - 60 - i * 16, fps, config: { damping: 18 } });
          const barW = interpolate(frame - 80 - i * 16, [0, 60], [0, w.percent * 2.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "center", opacity: s, transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)` }}>
              <div style={{ fontSize: 32, width: 50, textAlign: "center" }}>{w.icon}</div>
              <div style={{ width: 200 }}>
                <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text }}>{w.name}</div>
                <div style={{ fontFamily: mono, fontSize: 13, color: w.color }}>{w.en}</div>
              </div>
              <div style={{ flex: 1, height: 12, background: `${w.color}15`, borderRadius: 6 }}>
                <div style={{ height: "100%", width: barW, background: `linear-gradient(90deg, ${w.color}, ${w.color}80)`, borderRadius: 6 }} />
              </div>
              <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: w.color, width: 60, textAlign: "center" }}>{w.percent}%</div>
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
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="التصنيف الذكي بالذكاء الاصطناعي" titleEn="AI-Powered Classification" episodeNum={17} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📸" titleAr="تصنيف بالصور" titleEn="Image Classification" desc="التقط صورة للمخلفات والذكاء الاصطناعي يحدد النوع والفئة تلقائياً" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="🔬" titleAr="تحليل التركيب" titleEn="Composition Analysis" desc="تحديد نسب المواد المختلفة في الشحنة الواحدة بدقة عالية" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="⚠️" titleAr="كشف المواد الخطرة" titleEn="Hazard Detection" desc="تنبيه فوري عند اكتشاف مواد خطرة أو محظورة في الشحنة" color={C.rose} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={120} icon="📋" titleAr="تقرير التصنيف" titleEn="Classification Report" desc="تقرير مفصل بنوع المخلفات وفئة الخطورة وطريقة المعالجة المثلى" color={C.cyan} />
        </div>
        <GlassCard frame={frame} fps={fps} dark={dark} delay={80} style={{ width: 380 }}>
          <div style={{ fontFamily: mono, fontSize: 14, color: C.amber, marginBottom: 16 }}>🤖 AI CLASSIFICATION</div>
          <div style={{ fontFamily: cairo, fontSize: 22, color: t(dark).text, marginBottom: 12 }}>نتيجة التصنيف</div>
          {[
            { label: "النوع الرئيسي", value: "مخلفات صناعية", color: C.emerald },
            { label: "فئة الخطورة", value: "منخفضة", color: C.cyan },
            { label: "قابلية التدوير", value: "92%", color: C.amber },
            { label: "الثقة", value: "97.3%", color: C.emerald },
          ].map((r, i) => {
            const s = spring({ frame: frame - 100 - i * 12, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, opacity: s }}>
                <span style={{ fontFamily: cairo, fontSize: 16, color: t(dark).muted }}>{r.label}</span>
                <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: r.color }}>{r.value}</span>
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
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="المعايير والتصنيفات الدولية" titleEn="International Standards" episodeNum={17} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🇪🇬" titleAr="المعايير المصرية" titleEn="Egyptian Standards" desc="التوافق مع قانون إدارة المخلفات رقم 202 لسنة 2020 واللائحة التنفيذية" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="🌍" titleAr="معايير بازل الدولية" titleEn="Basel Convention" desc="الالتزام باتفاقية بازل لنقل المخلفات الخطرة عبر الحدود" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="📊" titleAr="رموز EWC الأوروبية" titleEn="EWC Codes" desc="تصنيف المخلفات حسب الكود الأوروبي الموحد لسهولة التعامل الدولي" color={C.cyan} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>
          <S4Stat frame={frame} fps={fps} dark={dark} delay={70} icon="📜" value="202" label="قانون المخلفات" labelEn="Waste Law" color={C.amber} />
          <S4Stat frame={frame} fps={fps} dark={dark} delay={90} icon="🏷️" value="850+" label="كود تصنيف" labelEn="EWC Codes" color={C.cyan} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات التصنيف" titleEn="Classification Analytics" episodeNum={17} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏷️" value="12K+" label="تصنيف شهري" labelEn="Monthly" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🤖" value="97%" label="دقة AI" labelEn="AI Accuracy" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⚡" value="<3s" label="وقت التصنيف" labelEn="Classification" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="♻️" value="78%" label="قابل للتدوير" labelEn="Recyclable" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={97} size={140} color={C.amber} label="دقة التصنيف" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={89} size={140} color={C.emerald} label="كشف الخطورة" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={94} size={140} color={C.cyan} label="تطابق المعايير" dark={dark} />
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
        <TransitionSeries.Sequence durationInFrames={500}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={17} nextTitle="Documentation" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep17Dark = () => <EpisodeVideo dark={true} />;
export const Ep17Light = () => <EpisodeVideo dark={false} />;
