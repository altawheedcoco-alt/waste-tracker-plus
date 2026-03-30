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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="تحسين المسارات الذكي" titleEn="AI Route Optimization" subtitle="أقصر طريق، أقل تكلفة، أسرع توصيل" episodeNum={29} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🗺️" titleAr="خوارزمية المسارات" titleEn="Route Algorithm" desc="حساب أمثل المسارات مع مراعاة حركة المرور والمسافة والأولوية" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="⛽" titleAr="توفير الوقود" titleEn="Fuel Optimization" desc="تقليل استهلاك الوقود بنسبة 30% عبر المسارات المحسّنة" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📍" titleAr="تتبع حي" titleEn="Live Tracking" desc="خريطة حية لكل المركبات مع تحديث كل 10 ثوانٍ" color={C6.amber} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="🔀" titleAr="إعادة توجيه ديناميكي" titleEn="Dynamic Rerouting" desc="تعديل المسار تلقائياً عند حدوث حوادث أو ازدحام مروري" color={C6.indigo} />
        </div>
        {/* Map visualization */}
        <div style={{ width: 360, height: 360, position: "relative" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20 } });
            const points = [
              { x: 60, y: 80 }, { x: 180, y: 40 }, { x: 280, y: 120 },
              { x: 320, y: 250 }, { x: 200, y: 300 }, { x: 100, y: 240 },
            ];
            return (
              <svg width="360" height="360" style={{ opacity: s }}>
                {points.map((p, i) => {
                  const next = points[(i + 1) % points.length];
                  const progress = Math.min(1, Math.max(0, (frame - 80 - i * 15) / 30));
                  return (
                    <line key={i}
                      x1={p.x} y1={p.y}
                      x2={p.x + (next.x - p.x) * progress}
                      y2={p.y + (next.y - p.y) * progress}
                      stroke={C6.orange} strokeWidth={2} strokeDasharray="6,4"
                      opacity={0.7}
                    />
                  );
                })}
                {points.map((p, i) => {
                  const ps = spring({ frame: frame - 75 - i * 12, fps, config: { damping: 15 } });
                  return (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r={12 * ps} fill={`${C6.orange}20`} stroke={C6.orange} strokeWidth={2} />
                      <circle cx={p.x} cy={p.y} r={4 * ps} fill={C6.orange} />
                    </g>
                  );
                })}
                {/* Moving truck dot */}
                {(() => {
                  const idx = Math.floor((frame * 0.02) % points.length);
                  const nextIdx = (idx + 1) % points.length;
                  const t = (frame * 0.02) % 1;
                  const tx = points[idx].x + (points[nextIdx].x - points[idx].x) * t;
                  const ty = points[idx].y + (points[nextIdx].y - points[idx].y) * t;
                  return <circle cx={tx} cy={ty} r={6} fill={C6.teal} opacity={0.9} />;
                })()}
              </svg>
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
  const features = [
    { icon: "🚛", name: "إدارة الأسطول", en: "Fleet Management", color: C6.orange },
    { icon: "📊", name: "تحليلات القيادة", en: "Driving Analytics", color: C6.amber },
    { icon: "🔧", name: "صيانة وقائية", en: "Preventive Maintenance", color: C6.teal },
    { icon: "📋", name: "تقارير السائقين", en: "Driver Reports", color: C6.indigo },
    { icon: "⏱️", name: "إدارة الوقت", en: "Time Management", color: C6.red },
    { icon: "🌍", name: "بصمة كربونية", en: "Carbon Footprint", color: C6.teal },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="إدارة الأسطول المتكاملة" titleEn="Integrated Fleet Management" episodeNum={29} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {features.map((f, i) => {
          const s = spring({ frame: frame - 55 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{f.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: f.color }}>{f.en}</div>
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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="نتائج تحسين المسارات" titleEn="Route Optimization Results" episodeNum={29} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⛽" value="30%" label="توفير وقود" labelEn="Fuel Saved" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⏱️" value="40%" label="توفير وقت" labelEn="Time Saved" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🗺️" value="10K+" label="مسار محسّن" labelEn="Routes Optimized" color={C6.amber} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🌍" value="25%" label="أقل انبعاثات" labelEn="Lower Emissions" color={C6.indigo} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={29} nextTitle="Scheduling" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep29Dark = () => <EpisodeVideo dark={true} />;
export const Ep29Light = () => <EpisodeVideo dark={false} />;
