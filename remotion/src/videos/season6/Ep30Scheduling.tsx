import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S6Background, S6Header, S6Outro, S6Feature, S6Stat, cairo, inter, mono, C6, t6 } from "./S6Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="الجدولة والتخطيط الذكي" titleEn="Smart Scheduling & Planning" subtitle="تخطيط عمليات الجمع والنقل بدقة متناهية" episodeNum={30} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📅" titleAr="جدولة تلقائية" titleEn="Auto Scheduling" desc="توزيع المهام والشحنات آلياً حسب الأولوية والموقع والسعة" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="👷" titleAr="تعيين الفرق" titleEn="Team Assignment" desc="تخصيص السائقين والفرق حسب المهارات والتوفر والقرب" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="🔔" titleAr="تذكيرات ذكية" titleEn="Smart Reminders" desc="تنبيهات مسبقة للفرق والعملاء قبل موعد الجمع" color={C6.amber} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📈" titleAr="تحسين الموارد" titleEn="Resource Optimization" desc="تعظيم الاستفادة من كل مركبة وكل عامل يومياً" color={C6.indigo} />
        </div>
        {/* Calendar visualization */}
        <div style={{ width: 360, height: 360, position: "relative" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20 } });
            const th = t6(dark);
            const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس"];
            const slots = [
              { day: 0, slot: 0, color: C6.orange }, { day: 0, slot: 1, color: C6.teal },
              { day: 1, slot: 0, color: C6.amber }, { day: 1, slot: 2, color: C6.orange },
              { day: 2, slot: 1, color: C6.indigo }, { day: 2, slot: 2, color: C6.teal },
              { day: 3, slot: 0, color: C6.orange }, { day: 3, slot: 1, color: C6.amber },
              { day: 4, slot: 0, color: C6.teal }, { day: 4, slot: 2, color: C6.indigo },
            ];
            return (
              <div style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})` }}>
                {days.map((day, di) => (
                  <div key={di} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <div style={{ fontFamily: cairo, fontSize: 12, color: th.muted, width: 50, textAlign: "center" }}>{day}</div>
                    {[0, 1, 2].map(si => {
                      const slot = slots.find(s => s.day === di && s.slot === si);
                      const ss = spring({ frame: frame - 85 - di * 10 - si * 5, fps, config: { damping: 18 } });
                      return (
                        <div key={si} style={{
                          flex: 1, height: 28, borderRadius: 6,
                          background: slot ? `${slot.color}25` : `${th.borderSoft}`,
                          border: slot ? `1px solid ${slot.color}40` : `1px solid ${th.borderSoft}`,
                          opacity: ss,
                        }} />
                      );
                    })}
                  </div>
                ))}
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
  const th = t6(dark);
  const modes = [
    { icon: "🔁", name: "جمع دوري", en: "Recurring Collection", color: C6.orange },
    { icon: "🆘", name: "طلب طارئ", en: "Emergency Request", color: C6.red },
    { icon: "📦", name: "جمع عند الطلب", en: "On-Demand Pickup", color: C6.teal },
    { icon: "🏭", name: "عقود شهرية", en: "Monthly Contracts", color: C6.amber },
    { icon: "📊", name: "تخطيط موسمي", en: "Seasonal Planning", color: C6.indigo },
    { icon: "🤝", name: "تنسيق مشترك", en: "Joint Coordination", color: C6.steel },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أنماط الجدولة" titleEn="Scheduling Modes" episodeNum={30} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {modes.map((m, i) => {
          const s = spring({ frame: frame - 55 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{m.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: m.color }}>{m.en}</div>
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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="كفاءة الجدولة" titleEn="Scheduling Efficiency" episodeNum={30} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📅" value="95%" label="التزام بالمواعيد" labelEn="On-Time Rate" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="👷" value="60%" label="كفاءة الفرق" labelEn="Team Efficiency Up" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🚛" value="200+" label="رحلة يومية" labelEn="Daily Trips" color={C6.amber} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="⏱️" value="<5min" label="وقت التخطيط" labelEn="Planning Time" color={C6.indigo} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={30} nextTitle="Security" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep30Dark = () => <EpisodeVideo dark={true} />;
export const Ep30Light = () => <EpisodeVideo dark={false} />;
