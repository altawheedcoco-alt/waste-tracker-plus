import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S4Background, S4Header, S4Outro, S4Feature, S4Stat, S4Dashboard, GlassCard, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S4Common";

const TR = 30;

// Scene 1: What is a Shipment?
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const stages = [
    { icon: "📋", label: "إنشاء الطلب", en: "Order Created", color: C.amber },
    { icon: "✅", label: "موافقة", en: "Approved", color: C.emerald },
    { icon: "🚛", label: "جاري النقل", en: "In Transit", color: C.cyan },
    { icon: "⚖️", label: "وزن وفحص", en: "Weighed", color: C.indigo },
    { icon: "📦", label: "تسليم", en: "Delivered", color: C.teal },
    { icon: "📄", label: "فوترة", en: "Invoiced", color: C.emerald },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="دورة حياة الشحنة" titleEn="Shipment Lifecycle" subtitle="من الإنشاء حتى التسليم — كل خطوة محسوبة ومتتبعة" episodeNum={16} />
      <div style={{ display: "flex", gap: 20, marginTop: 60, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        {stages.map((s, i) => {
          const sp = spring({ frame: frame - 60 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
          const isActive = Math.floor((frame - 120) / 50) % stages.length === i;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 110, padding: "20px 16px", borderRadius: 16, textAlign: "center",
                background: isActive ? `${s.color}18` : th.card,
                border: `2px solid ${isActive ? s.color : th.borderSoft}`,
                opacity: sp, transform: `translateY(${interpolate(sp, [0, 1], [40, 0])}px) scale(${isActive ? 1.08 : 1})`,
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text }}>{s.label}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: s.color, marginTop: 4 }}>{s.en}</div>
              </div>
              {i < stages.length - 1 && (
                <div style={{
                  width: 30, height: 2, background: `linear-gradient(90deg, ${s.color}40, ${stages[i + 1].color}40)`,
                  opacity: sp,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Creating a Shipment
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إنشاء شحنة جديدة" titleEn="Creating a New Shipment" episodeNum={16} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🏭" titleAr="اختيار المنشأة المولّدة" titleEn="Select Generator" desc="حدد المنشأة المصدر ونوع النشاط والموقع الجغرافي" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="♻️" titleAr="تحديد نوع المخلفات" titleEn="Waste Classification" desc="اختر من قائمة المخلفات المصنفة حسب المعايير المصرية والدولية" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="⚖️" titleAr="الكمية والوزن المتوقع" titleEn="Estimated Weight" desc="أدخل الكمية التقديرية بالطن أو الكيلوجرام مع فئة الخطورة" color={C.cyan} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={120} icon="📍" titleAr="عنوان التحميل والتسليم" titleEn="Pickup & Delivery" desc="حدد نقاط التحميل والتسليم مع إمكانية الاختيار من الخريطة" color={C.indigo} />
        </div>
        <S4Dashboard frame={frame} fps={fps} dark={dark} delay={70} title="New Shipment Form" />
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Tracking & Monitoring
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const trackPoints = [
    { time: "08:30", event: "خروج من المنشأة", status: "✅", color: C.emerald },
    { time: "09:15", event: "وصول نقطة التفتيش", status: "✅", color: C.emerald },
    { time: "09:45", event: "جاري الطريق — 75% مكتمل", status: "🔄", color: C.amber },
    { time: "10:30", event: "الوصول المتوقع للمصنع", status: "⏳", color: C.cyan },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="التتبع والمراقبة الحية" titleEn="Real-time Tracking & Monitoring" episodeNum={16} />
      <div style={{ display: "flex", gap: 50, marginTop: 50 }}>
        {/* Timeline */}
        <div style={{ flex: 1 }}>
          {trackPoints.map((tp, i) => {
            const s = spring({ frame: frame - 60 - i * 20, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 20, marginBottom: 28, opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${tp.color}15`, border: `2px solid ${tp.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{tp.status}</div>
                  {i < trackPoints.length - 1 && <div style={{ width: 2, height: 40, background: `${tp.color}30`, marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 13, color: tp.color }}>{tp.time}</div>
                  <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginTop: 4 }}>{tp.event}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Map placeholder */}
        <GlassCard frame={frame} fps={fps} dark={dark} delay={80} style={{ width: 450, height: 320 }}>
          <div style={{ fontFamily: mono, fontSize: 13, color: C.amber, marginBottom: 12 }}>📍 LIVE TRACKING</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: cairo, fontSize: 20, color: th.text }}>🚛 شاحنة TRK-2847</div>
            <div style={{ fontFamily: mono, fontSize: 14, color: th.muted }}>السائق: أحمد محمد</div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 14, color: C.emerald }}>⬤ متصل</div>
              <div style={{ fontFamily: mono, fontSize: 14, color: C.amber }}>السرعة: 65 كم/س</div>
            </div>
            <div style={{ marginTop: 12, height: 8, background: `${C.emerald}15`, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${interpolate(frame - 100, [0, 80], [0, 75], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`, background: C.emerald, borderRadius: 4 }} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: th.muted }}>75% — ETA: 45 min</div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Stats
const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الشحنات" titleEn="Shipment Analytics" episodeNum={16} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S4Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📦" value="45K+" label="شحنة مكتملة" labelEn="Completed" color={C.amber} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🚛" value="2,400" label="شاحنة نشطة" labelEn="Active Trucks" color={C.emerald} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⏱️" value="4.2h" label="متوسط التسليم" labelEn="Avg Delivery" color={C.cyan} />
        <S4Stat frame={frame} fps={fps} dark={dark} delay={95} icon="✅" value="98.5%" label="معدل النجاح" labelEn="Success Rate" color={C.teal} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={98} size={140} color={C.amber} label="التسليم في الوقت" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={95} size={140} color={C.emerald} label="دقة الوزن" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={92} size={140} color={C.cyan} label="رضا العملاء" dark={dark} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Automation
const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S4Header frame={frame} fps={fps} dark={dark} titleAr="أتمتة الشحنات" titleEn="Shipment Automation" episodeNum={16} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S4Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🤖" titleAr="إنشاء تلقائي للشحنات" titleEn="Auto-create Shipments" desc="جدولة شحنات دورية أسبوعية أو شهرية بضغطة واحدة" color={C.amber} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={80} icon="📊" titleAr="تحسين المسارات بالذكاء" titleEn="AI Route Optimization" desc="خوارزميات ذكية لاختيار أقصر المسارات وأقل استهلاك للوقود" color={C.emerald} />
          <S4Feature frame={frame} fps={fps} dark={dark} delay={100} icon="🔔" titleAr="تنبيهات استباقية" titleEn="Proactive Alerts" desc="إشعارات ذكية للتأخيرات المتوقعة والمشكلات المحتملة" color={C.cyan} />
        </div>
        <S4Dashboard frame={frame} fps={fps} dark={dark} delay={70} title="Automation Dashboard" />
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
        <TransitionSeries.Sequence durationInFrames={520}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={540}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={500}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S4Outro frame={0} fps={30} dark={dark} episodeNum={16} nextTitle="Waste Types" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S4Background>
  );
};

export const Ep16Dark = () => <EpisodeVideo dark={true} />;
export const Ep16Light = () => <EpisodeVideo dark={false} />;
