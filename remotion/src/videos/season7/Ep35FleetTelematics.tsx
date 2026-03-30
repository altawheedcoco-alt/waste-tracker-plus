import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S7Background, S7Header, S7Outro, S7Feature, S7Stat, cairo, fira, C7, t7 } from "./S7Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="تتبع الأسطول الذكي" titleEn="Fleet Telematics & GPS" subtitle="نظام متكامل لتتبع المركبات والسائقين بدقة GPS عالية" episodeNum={35} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <S7Feature frame={frame} fps={fps} dark={dark} delay={55} icon="🛰️" titleAr="تتبع GPS حي" titleEn="Live GPS Tracking" desc="تحديث موقع كل مركبة كل ١٠ ثوانٍ مع عرض المسار الكامل على الخريطة" color={C7.neon} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🚛" titleAr="تشخيص المركبة" titleEn="Vehicle Diagnostics (OBD-II)" desc="قراءة بيانات المحرك والوقود والأعطال مباشرة من حاسوب المركبة" color={C7.cyan} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={91} icon="⛽" titleAr="إدارة الوقود" titleEn="Fuel Management" desc="حساب استهلاك الوقود الفعلي وكشف السرقات والتزويد غير المصرح" color={C7.electric} />
          <S7Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔔" titleAr="تنبيهات القيادة" titleEn="Driver Behavior Alerts" desc="رصد السرعة الزائدة والفرملة الحادة والتسارع المفاجئ والانحراف عن المسار" color={C7.pulse} />
        </div>
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20, stiffness: 120 } });
            return (
              <div style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`, position: "relative" }}>
                {/* Orbiting satellites */}
                {[0, 1, 2].map((i) => {
                  const a = (i / 3) * Math.PI * 2 + frame * 0.02;
                  const r = 110 + i * 25;
                  return (
                    <div key={i} style={{
                      position: "absolute", left: `calc(50% + ${Math.cos(a) * r}px)`, top: `calc(50% + ${Math.sin(a) * r}px)`,
                      transform: "translate(-50%, -50%)", fontSize: 24, opacity: 0.8,
                    }}>🛰️</div>
                  );
                })}
                <div style={{ fontSize: 64, position: "relative", zIndex: 1 }}>🚛</div>
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
  const features = [
    { icon: "📍", name: "سياج جغرافي", en: "Geofencing", color: C7.neon },
    { icon: "🛣️", name: "تحسين المسارات", en: "Route Optimization", color: C7.cyan },
    { icon: "📋", name: "سجل الرحلات", en: "Trip History", color: C7.electric },
    { icon: "🔧", name: "صيانة تنبؤية", en: "Predictive Maintenance", color: C7.pulse },
    { icon: "📊", name: "تقارير الأسطول", en: "Fleet Reports", color: C7.warm },
    { icon: "🏆", name: "تقييم السائقين", en: "Driver Scoring", color: C7.matrix },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="منظومة إدارة الأسطول" titleEn="Fleet Management Suite" episodeNum={35} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {features.map((f, i) => {
          const s = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${f.color}15`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{f.name}</div>
              <div style={{ fontFamily: fira, fontSize: 12, color: f.color }}>{f.en}</div>
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
      <S7Header frame={frame} fps={fps} dark={dark} titleAr="أداء الأسطول" titleEn="Fleet Performance" episodeNum={35} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S7Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🛰️" value="10s" label="تحديث الموقع" labelEn="Position Update" color={C7.neon} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⛽" value="25%" label="توفير وقود" labelEn="Fuel Savings" color={C7.cyan} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🚛" value="500+" label="مركبة متصلة" labelEn="Connected Vehicles" color={C7.electric} />
        <S7Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="99.5%" label="دقة التتبع" labelEn="Tracking Accuracy" color={C7.pulse} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S7Outro frame={0} fps={30} dark={dark} episodeNum={35} nextTitle="Environmental Sensors" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S7Background>
  );
};

export const Ep35Dark = () => <EpisodeVideo dark={true} />;
export const Ep35Light = () => <EpisodeVideo dark={false} />;
