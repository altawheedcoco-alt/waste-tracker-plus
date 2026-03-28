import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S3Background, S3Header, GlassCard, S3Feature, S3Stat, S3Dashboard, S3Outro, AnimCounter, ProgressRing, cairo, inter, mono, C, t } from "./S3Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const workers = [
    { name: "أحمد محمد", role: "سائق", status: "نشط", rating: 4.8, tasks: 12, icon: "🚛" },
    { name: "محمد علي", role: "فني فرز", status: "نشط", rating: 4.5, tasks: 8, icon: "🔧" },
    { name: "خالد حسن", role: "مشرف", status: "إجازة", rating: 4.9, tasks: 0, icon: "👷" },
    { name: "يوسف أحمد", role: "عامل وزن", status: "نشط", rating: 4.3, tasks: 15, icon: "⚖️" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إدارة القوى العاملة" titleEn="Workforce Management" subtitle="نظام شامل لإدارة فريق العمل والمهام والأداء" episodeNum={13} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Table header */}
          <div style={{ display: "flex", gap: 12, padding: "10px 20px", fontFamily: mono, fontSize: 11, color: th.muted }}>
            <span style={{ width: 200 }}>الاسم</span><span style={{ width: 100 }}>الدور</span>
            <span style={{ width: 80 }}>الحالة</span><span style={{ width: 60 }}>التقييم</span><span style={{ width: 60 }}>المهام</span>
          </div>
          {workers.map((w, i) => {
            const s = spring({ frame: frame - 70 - i * 14, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "center", padding: "16px 20px",
                background: th.card, border: `1px solid ${th.borderSoft}`, borderRadius: 12,
                opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
              }}>
                <div style={{ width: 200, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{w.icon}</span>
                  <span style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text }}>{w.name}</span>
                </div>
                <span style={{ width: 100, fontFamily: cairo, fontSize: 14, color: th.muted }}>{w.role}</span>
                <span style={{ width: 80 }}>
                  <span style={{
                    fontFamily: mono, fontSize: 11, padding: "3px 10px", borderRadius: 10,
                    color: w.status === "نشط" ? C.emerald : C.amber,
                    background: w.status === "نشط" ? `${C.emerald}12` : `${C.amber}12`,
                  }}>{w.status}</span>
                </span>
                <span style={{ width: 60, fontFamily: mono, fontSize: 14, color: C.amber }}>⭐ {w.rating}</span>
                <span style={{ width: 60, fontFamily: mono, fontSize: 14, color: C.cyan }}>{w.tasks}</span>
              </div>
            );
          })}
        </div>
        <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={90}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, direction: "rtl", marginBottom: 8 }}>إجمالي العاملين</div>
            <AnimCounter frame={frame} fps={fps} delay={100} target={1247} size={34} />
          </GlassCard>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={105}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, direction: "rtl", marginBottom: 8 }}>معدل الحضور</div>
            <AnimCounter frame={frame} fps={fps} delay={115} target={96} suffix="%" size={34} color={C.cyan} />
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إدارة المهام والجداول" titleEn="Task & Schedule Management" episodeNum={13} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 50 }}>
        <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="📋" titleAr="توزيع المهام الذكي" titleEn="Smart Task Assignment" desc="توزيع تلقائي للمهام بناءً على المهارات والموقع والحمل الحالي لكل عامل" color={C.emerald} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="📅" titleAr="جدولة ورديات مرنة" titleEn="Flexible Shift Scheduling" desc="إدارة الورديات والإجازات مع التبديل التلقائي وإشعارات التذكير" color={C.cyan} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📍" titleAr="تتبع الحضور الجغرافي" titleEn="GPS Attendance Tracking" desc="تسجيل الحضور والانصراف تلقائياً عبر الموقع الجغرافي مع سجل كامل" color={C.indigo} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={110} icon="🏆" titleAr="نظام الحوافز والمكافآت" titleEn="Incentive System" desc="حساب تلقائي للحوافز والعمولات بناءً على الأداء والإنجازات" color={C.amber} />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  const departments = [
    { name: "النقل والتوصيل", count: 420, perf: 94, color: C.emerald },
    { name: "الفرز والمعالجة", count: 380, perf: 91, color: C.cyan },
    { name: "الجودة والفحص", count: 180, perf: 97, color: C.indigo },
    { name: "الإدارة والتشغيل", count: 267, perf: 89, color: C.amber },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="أداء الأقسام" titleEn="Department Performance" episodeNum={13} />
      <div style={{ display: "flex", gap: 24, marginTop: 50 }}>
        {departments.map((d, i) => {
          const s = spring({ frame: frame - 60 - i * 15, fps, config: { damping: 18 } });
          return (
            <GlassCard key={i} frame={frame} fps={fps} dark={dark} delay={60 + i * 15} style={{ flex: 1, textAlign: "center" }}>
              <ProgressRing frame={frame} fps={fps} delay={70 + i * 15} percent={d.perf} size={110} color={d.color} label="" dark={dark} />
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginTop: 16 }}>{d.name}</div>
              <div style={{ fontFamily: mono, fontSize: 14, color: d.color, marginTop: 6 }}>{d.count} عامل</div>
            </GlassCard>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات القوى العاملة" titleEn="Workforce Analytics" episodeNum={13} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S3Stat frame={frame} fps={fps} dark={dark} delay={50} icon="👥" value="1,247" label="إجمالي العاملين" labelEn="Total Workers" color={C.emerald} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📈" value="96%" label="معدل الحضور" labelEn="Attendance Rate" color={C.cyan} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⭐" value="4.6/5" label="متوسط التقييم" labelEn="Avg Rating" color={C.amber} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🎯" value="92%" label="إنجاز المهام" labelEn="Task Completion" color={C.indigo} />
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 50, justifyContent: "center" }}>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={110} title="HR Dashboard" />
      </div>
    </AbsoluteFill>
  );
};

const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="التدريب والتطوير" titleEn="Training & Development" episodeNum={13} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
          <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="🎓" titleAr="أكاديمية iRecycle" titleEn="iRecycle Academy" desc="دورات تدريبية متخصصة في إدارة المخلفات وإعادة التدوير مع شهادات معتمدة" color={C.emerald} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="📱" titleAr="تعلم عبر الهاتف" titleEn="Mobile Learning" desc="محتوى تعليمي تفاعلي متاح في أي وقت ومكان عبر تطبيق المنصة" color={C.cyan} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📊" titleAr="تتبع التقدم" titleEn="Progress Tracking" desc="لوحة تحكم شاملة لمتابعة تقدم كل عامل في البرنامج التدريبي" color={C.indigo} />
        </div>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={60} title="Academy Portal" />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S3Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={530}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={540}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={490}><S3Outro frame={0} fps={30} dark={dark} episodeNum={13} nextTitle="Call Center & CRM" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S3Background>
  );
};

export const Ep13Dark = () => <EpisodeVideo dark={true} />;
export const Ep13Light = () => <EpisodeVideo dark={false} />;
