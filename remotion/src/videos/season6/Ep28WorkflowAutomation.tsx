import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S6Background, S6Header, S6Outro, S6Feature, S6Stat, S6GearIcon, cairo, inter, mono, C6, t6 } from "./S6Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أتمتة سير العمل" titleEn="Workflow Automation" subtitle="قواعد ذكية تنفذ المهام تلقائياً دون تدخل بشري" episodeNum={28} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🔄" titleAr="قواعد تلقائية" titleEn="Auto Rules Engine" desc="إنشاء قواعد if-then لأتمتة الموافقات والإشعارات وتحديث الحالات" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="📧" titleAr="إشعارات ذكية" titleEn="Smart Notifications" desc="إرسال تلقائي عبر البريد، واتساب، وتليجرام حسب الحدث" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="✅" titleAr="موافقات متسلسلة" titleEn="Approval Chains" desc="سلاسل موافقة متعددة المستويات مع تصعيد آلي" color={C6.amber} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📊" titleAr="تقارير دورية" titleEn="Scheduled Reports" desc="توليد وإرسال تقارير يومية/أسبوعية/شهرية تلقائياً" color={C6.indigo} />
        </div>
        <S6GearIcon frame={frame} fps={fps} dark={dark} delay={70} />
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t6(dark);
  const steps = [
    { icon: "🎯", name: "محفز الحدث", en: "Event Trigger", color: C6.orange },
    { icon: "🔍", name: "فحص الشروط", en: "Condition Check", color: C6.amber },
    { icon: "⚡", name: "تنفيذ الإجراء", en: "Execute Action", color: C6.teal },
    { icon: "📋", name: "تسجيل السجل", en: "Log & Audit", color: C6.indigo },
    { icon: "📨", name: "إشعار الأطراف", en: "Notify Parties", color: C6.orange },
    { icon: "✅", name: "تأكيد الإنجاز", en: "Confirm Complete", color: C6.teal },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="مراحل الأتمتة" titleEn="Automation Pipeline" episodeNum={28} />
      <div style={{ display: "flex", gap: 16, marginTop: 70, justifyContent: "center", alignItems: "center" }}>
        {steps.map((step, i) => {
          const s = spring({ frame: frame - 55 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 160, padding: "24px 16px", borderRadius: 16, textAlign: "center",
                background: th.card, border: `1px solid ${step.color}20`,
                opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
              }}>
                <div style={{ fontSize: 38, marginBottom: 10 }}>{step.icon}</div>
                <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{step.name}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: step.color }}>{step.en}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  fontFamily: mono, fontSize: 20, color: C6.orange,
                  opacity: spring({ frame: frame - 70 - i * 18, fps, config: { damping: 20 } }),
                }}>→</div>
              )}
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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الأتمتة" titleEn="Automation Impact" episodeNum={28} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⚡" value="85%" label="توفير الوقت" labelEn="Time Saved" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔄" value="50K+" label="مهمة مؤتمتة" labelEn="Tasks Automated" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="99.2%" label="دقة التنفيذ" labelEn="Execution Accuracy" color={C6.amber} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="24/7" label="عمل مستمر" labelEn="Non-Stop Operations" color={C6.indigo} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S6Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={28} nextTitle="Route Optimization" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep28Dark = () => <EpisodeVideo dark={true} />;
export const Ep28Light = () => <EpisodeVideo dark={false} />;
