import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S7Background, S7Header, S7Outro, S7Feature, S7Stat, C7, t7, cairo, fira } from "./S7Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="التوائم الرقمية" titleEn="Digital Twins & Simulation" subtitle="نسخة رقمية حية من كل أصل مادي — حاويات، مركبات، مرافق" episodeNum={39} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🏭" titleAr="توأم المرفق" titleEn="Facility Twin" desc="نموذج ثلاثي الأبعاد تفاعلي لمرافق إدارة المخلفات بالبيانات الحية" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🚛" titleAr="توأم الأسطول" titleEn="Fleet Twin" desc="محاكاة المسارات والحمولات واستهلاك الوقود قبل التنفيذ الفعلي" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🔮" titleAr="محاكاة السيناريوهات" titleEn="Scenario Simulation" desc="اختبار قرارات التشغيل افتراضياً — ماذا لو أضفنا ١٠ حاويات؟" color={C7.electric} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="تحسين مستمر" titleEn="Continuous Optimization" desc="التوأم الرقمي يقترح تحسينات بناءً على المقارنة بين الواقع والنموذج" color={C7.pulse} />
        </div>
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 65, fps, config: { damping: 20 } });
            const mirror = Math.sin(frame * 0.03) * 8;
            return (
              <div style={{ opacity: s, position: "relative" }}>
                {/* Physical asset */}
                <div style={{
                  fontSize: 56, position: "absolute", left: -60, top: 0,
                  transform: `translateY(${mirror}px)`,
                }}>🏭</div>
                {/* Mirror line */}
                <div style={{
                  position: "absolute", left: 20, top: -60, width: 2, height: 180,
                  background: `linear-gradient(to bottom, transparent, ${C7.neon}, transparent)`,
                  opacity: 0.5,
                }} />
                {/* Digital twin */}
                <div style={{
                  fontSize: 56, position: "absolute", left: 50, top: 0,
                  transform: `translateY(${-mirror}px) scaleX(-1)`,
                  opacity: 0.6, filter: dark ? `drop-shadow(0 0 15px ${C7.neon}50)` : "none",
                }}>🏭</div>
                {/* Label */}
                <div style={{
                  position: "absolute", top: 80, left: -40, width: 160,
                  fontFamily: fira, fontSize: 11, color: C7.neon, textAlign: "center",
                  opacity: 0.7,
                }}>DIGITAL TWIN SYNC</div>
              </div>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t7(dark);
  const useCases = [
    { icon: "🔧", name: "صيانة افتراضية", en: "Virtual Maintenance", color: C7.neon },
    { icon: "📐", name: "تخطيط السعة", en: "Capacity Planning", color: C7.cyan },
    { icon: "🎓", name: "تدريب المشغلين", en: "Operator Training", color: C7.electric },
    { icon: "⚠️", name: "اختبار الطوارئ", en: "Emergency Testing", color: C7.pulse },
    { icon: "💡", name: "ابتكار العمليات", en: "Process Innovation", color: C7.warm },
    { icon: "📋", name: "تقارير الأداء", en: "Performance Reports", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="حالات الاستخدام" titleEn="Digital Twin Use Cases" episodeNum={39} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {useCases.map((u, i) => {
          const s = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${u.color}15`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{u.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{u.name}</div>
              <div style={{ fontFamily: fira, fontSize: 12, color: u.color }}>{u.en}</div>
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="أثر التوائم الرقمية" titleEn="Digital Twin Impact" episodeNum={39} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏭" value="1:1" label="مطابقة كاملة" labelEn="Perfect Replica" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔮" value="50+" label="سيناريو محاكاة" labelEn="Simulations" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💰" value="45%" label="توفير التكاليف" labelEn="Cost Reduction" color={C7.electric} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="⏱️" value="Real" label="مزامنة حية" labelEn="Live Sync" color={C7.pulse} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S7Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={39} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep39Dark = () => <EpisodeVideo dark={true} />;
export const Ep39Light = () => <EpisodeVideo dark={false} />;
