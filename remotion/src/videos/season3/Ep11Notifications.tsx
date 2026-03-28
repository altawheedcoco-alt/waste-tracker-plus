import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S3Background, S3Header, GlassCard, S3Feature, S3Stat, S3Dashboard, S3Outro, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S3Common";

const TR = 30;

// Scene 1: Intro
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  // Animated notification bell
  const bellS = spring({ frame: frame - 60, fps, config: { damping: 8 } });
  const bellRot = Math.sin(frame * 0.15) * (frame > 60 ? 15 * Math.max(0, 1 - (frame - 60) / 100) : 0);

  // Notification cards cascading
  const notifications = [
    { text: "شحنة جديدة #SH-4521 تم إنشاؤها", time: "الآن", icon: "📦", color: C.emerald },
    { text: "تنبيه: تجاوز الحمولة بنسبة 12%", time: "منذ 2 دقيقة", icon: "⚠️", color: C.amber },
    { text: "اكتمل فحص الجودة - درجة A+", time: "منذ 5 دقائق", icon: "✅", color: C.cyan },
    { text: "فاتورة #INV-892 بانتظار الموافقة", time: "منذ 8 دقائق", icon: "📄", color: C.indigo },
    { text: "سائق محمد وصل لنقطة التسليم", time: "منذ 12 دقيقة", icon: "🚛", color: C.teal },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="الإشعارات الذكية" titleEn="Smart Notifications & Alerts" subtitle="نظام تنبيهات متقدم يبقيك على اطلاع بكل تفاصيل عملياتك" episodeNum={11} />

      <div style={{ display: "flex", gap: 50, marginTop: 50 }}>
        {/* Notification center mockup */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {notifications.map((n, i) => {
            const s = spring({ frame: frame - 80 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
            const isNew = i === 0;
            return (
              <div key={i} style={{
                display: "flex", gap: 16, alignItems: "center",
                background: isNew ? `${n.color}10` : th.card,
                border: `1px solid ${isNew ? `${n.color}25` : th.borderSoft}`,
                borderRadius: 14, padding: "16px 22px",
                opacity: s, transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: cairo, fontSize: 16, color: th.text, fontWeight: isNew ? 700 : 400 }}>{n.text}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: n.color, marginTop: 4 }}>{n.time}</div>
                </div>
                {isNew && <div style={{ width: 10, height: 10, borderRadius: "50%", background: n.color, boxShadow: `0 0 12px ${n.color}50` }} />}
              </div>
            );
          })}
        </div>

        {/* Bell animation area */}
        <div style={{ width: 350, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
          <div style={{
            fontSize: 120, transform: `scale(${bellS}) rotate(${bellRot}deg)`, opacity: bellS,
          }}>🔔</div>
          <div style={{
            fontFamily: mono, fontSize: 48, fontWeight: 700, color: C.emerald,
            opacity: spring({ frame: frame - 90, fps, config: { damping: 18 } }),
          }}>
            <AnimCounter frame={frame} fps={fps} delay={90} target={2847} size={48} />
          </div>
          <div style={{
            fontFamily: cairo, fontSize: 18, color: th.muted,
            opacity: spring({ frame: frame - 100, fps, config: { damping: 18 } }),
          }}>إشعار يومي عبر المنصة</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Notification Channels
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const channels = [
    { icon: "📱", titleAr: "إشعارات التطبيق", titleEn: "Push Notifications", desc: "تنبيهات فورية على الهاتف والمتصفح مع إمكانية التخصيص حسب الأولوية", color: C.emerald },
    { icon: "📧", titleAr: "البريد الإلكتروني", titleEn: "Email Alerts", desc: "ملخصات يومية وتقارير أسبوعية مع تنبيهات عاجلة للأحداث الحرجة", color: C.cyan },
    { icon: "💬", titleAr: "واتساب وتليجرام", titleEn: "WhatsApp & Telegram", desc: "إشعارات مباشرة على تطبيقات المراسلة مع ردود ذكية تلقائية", color: C.teal },
    { icon: "📊", titleAr: "لوحة التحكم المباشرة", titleEn: "Live Dashboard", desc: "عرض حي لجميع التنبيهات مع فلترة وتصنيف ذكي حسب النوع", color: C.indigo },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="قنوات التنبيه المتعددة" titleEn="Multi-Channel Alerts" episodeNum={11} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 50 }}>
        {channels.map((ch, i) => (
          <S3Feature key={i} frame={frame} fps={fps} dark={dark} delay={60 + i * 20}
            icon={ch.icon} titleAr={ch.titleAr} titleEn={ch.titleEn} desc={ch.desc} color={ch.color} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Smart Filtering & Priorities
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const priorities = [
    { level: "حرج", color: C.rose, percent: 5, count: "142", en: "CRITICAL" },
    { level: "عالي", color: C.amber, percent: 15, count: "428", en: "HIGH" },
    { level: "متوسط", color: C.cyan, percent: 35, count: "1,003", en: "MEDIUM" },
    { level: "منخفض", color: C.emerald, percent: 45, count: "1,289", en: "LOW" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="فلترة ذكية وأولويات" titleEn="Smart Filtering & Priority System" episodeNum={11} />

      <div style={{ display: "flex", gap: 40, marginTop: 50, alignItems: "flex-start" }}>
        {/* Priority breakdown */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {priorities.map((p, i) => {
            const s = spring({ frame: frame - 60 - i * 15, fps, config: { damping: 18 } });
            const barW = interpolate(frame - 80 - i * 15, [0, 60], [0, p.percent], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: s, transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: p.color }} />
                    <span style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text }}>{p.level}</span>
                    <span style={{ fontFamily: mono, fontSize: 12, color: p.color }}>{p.en}</span>
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 16, color: p.color }}>{p.count}</span>
                </div>
                <div style={{ height: 8, background: `${p.color}15`, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barW}%`, background: p.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Filter visual */}
        <GlassCard frame={frame} fps={fps} dark={dark} delay={80} style={{ width: 380 }}>
          <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 20, direction: "rtl" }}>🤖 الفلترة بالذكاء الاصطناعي</div>
          {["تصنيف تلقائي حسب النوع", "تجميع الإشعارات المتشابهة", "حظر التنبيهات المتكررة", "تعلم من تفضيلاتك"].map((t2, i) => {
            const cs = spring({ frame: frame - 100 - i * 12, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, opacity: cs, direction: "rtl" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald, boxShadow: `0 0 8px ${C.emerald}40` }} />
                <span style={{ fontFamily: cairo, fontSize: 15, color: th.muted }}>{t2}</span>
              </div>
            );
          })}
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="أرقام وإحصائيات" titleEn="Performance Metrics" episodeNum={11} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S3Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔔" value="2.8M+" label="إشعار شهري" labelEn="Monthly Notifications" color={C.emerald} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<2s" label="وقت التسليم" labelEn="Delivery Time" color={C.cyan} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🎯" value="99.7%" label="معدل الوصول" labelEn="Delivery Rate" color={C.indigo} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🤖" value="85%" label="فلترة ذكية" labelEn="AI Filtered" color={C.amber} />
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 60, justifyContent: "center" }}>
        <ProgressRing frame={frame} fps={fps} delay={110} percent={97} size={140} color={C.emerald} label="رضا المستخدمين" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={125} percent={92} size={140} color={C.cyan} label="دقة التصنيف" dark={dark} />
        <ProgressRing frame={frame} fps={fps} delay={140} percent={88} size={140} color={C.indigo} label="تقليل الإزعاج" dark={dark} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Real-time Dashboard
const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="مركز التحكم المباشر" titleEn="Real-time Control Center" episodeNum={11} />
      <div style={{ display: "flex", gap: 40, marginTop: 50, alignItems: "center" }}>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={50} title="Notification Center" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="🔄" titleAr="تحديث لحظي" titleEn="Real-time Updates" desc="مزامنة فورية لجميع التنبيهات عبر كل الأجهزة والمستخدمين" color={C.emerald} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📈" titleAr="تحليلات الإشعارات" titleEn="Notification Analytics" desc="تقارير تفصيلية عن أنماط الإشعارات وأوقات الذروة" color={C.cyan} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={110} icon="⚙️" titleAr="إعدادات متقدمة" titleEn="Advanced Settings" desc="تخصيص كامل لقواعد الإشعارات والجداول الزمنية والأولويات" color={C.indigo} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S3Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={520}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={540}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S3Outro frame={0} fps={30} dark={dark} episodeNum={11} nextTitle="Financial Management" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S3Background>
  );
};

export const Ep11Dark = () => <EpisodeVideo dark={true} />;
export const Ep11Light = () => <EpisodeVideo dark={false} />;
