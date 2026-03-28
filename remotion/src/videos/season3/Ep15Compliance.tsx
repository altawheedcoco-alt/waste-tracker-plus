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

  const standards = [
    { name: "ISO 14001", desc: "نظام الإدارة البيئية", status: "معتمد", color: C.emerald, icon: "🌍" },
    { name: "ISO 45001", desc: "السلامة والصحة المهنية", status: "معتمد", color: C.cyan, icon: "🛡️" },
    { name: "GDPR", desc: "حماية البيانات الشخصية", status: "متوافق", color: C.indigo, icon: "🔐" },
    { name: "Basel Convention", desc: "نقل المخلفات الخطرة", status: "ملتزم", color: C.amber, icon: "⚖️" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="الامتثال والحوكمة" titleEn="Compliance & Governance" subtitle="ضمان الالتزام بالمعايير الدولية والتشريعات البيئية" episodeNum={15} />
      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {standards.map((st, i) => {
            const s = spring({ frame: frame - 70 - i * 14, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 18, alignItems: "center", padding: "20px 24px",
                background: th.card, border: `1px solid ${th.borderSoft}`, borderRadius: 14,
                opacity: s, transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
              }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>{st.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: st.color }}>{st.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, padding: "3px 10px", borderRadius: 10, color: C.emerald, background: `${C.emerald}12`, border: `1px solid ${C.emerald}20` }}>✓ {st.status}</span>
                  </div>
                  <div style={{ fontFamily: cairo, fontSize: 15, color: th.muted }}>{st.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ width: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <ProgressRing frame={frame} fps={fps} delay={90} percent={98} size={160} color={C.emerald} label="نسبة الامتثال الكلي" dark={dark} />
          <GlassCard frame={frame} fps={fps} dark={dark} delay={110} style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, marginBottom: 6 }}>آخر تدقيق ناجح</div>
            <div style={{ fontFamily: mono, fontSize: 16, color: C.emerald }}>2026-03-15</div>
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="أدوات الحوكمة المتقدمة" titleEn="Advanced Governance Tools" episodeNum={15} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 50 }}>
        <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="📋" titleAr="قوائم تدقيق رقمية" titleEn="Digital Audit Checklists" desc="قوائم فحص شاملة مبنية على معايير ISO مع ربط آلي بالبيانات والأدلة" color={C.emerald} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="🔍" titleAr="مراجعة خارجية رقمية" titleEn="Digital External Audits" desc="بوابة مخصصة للمراجعين الخارجيين مع صلاحيات محددة ووصول مؤقت" color={C.cyan} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📊" titleAr="تقارير الامتثال التلقائية" titleEn="Automated Compliance Reports" desc="توليد تقارير دورية تلقائياً مع مقارنة بالفترات السابقة وتحديد الفجوات" color={C.indigo} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={110} icon="⚠️" titleAr="نظام إنذار مبكر" titleEn="Early Warning System" desc="تنبيهات استباقية قبل انتهاء صلاحية التراخيص والشهادات والتصاريح" color={C.amber} />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  // Compliance timeline
  const timeline = [
    { date: "Q1 2026", event: "تدقيق ISO 14001 — ناجح", color: C.emerald },
    { date: "Q2 2026", event: "مراجعة سلامة — 98%", color: C.cyan },
    { date: "Q3 2026", event: "تحديث سياسة البيانات", color: C.indigo },
    { date: "Q4 2026", event: "تدقيق شامل سنوي", color: C.amber },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="خارطة الامتثال الزمنية" titleEn="Compliance Roadmap" episodeNum={15} />
      <div style={{ display: "flex", gap: 50, marginTop: 50 }}>
        {/* Timeline */}
        <div style={{ flex: 1, position: "relative", paddingRight: 40 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", right: 15, top: 0, width: 2, borderRadius: 1,
            height: interpolate(frame, [60, 250], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            background: `linear-gradient(180deg, ${C.emerald}, ${C.cyan}, ${C.indigo}, ${C.amber})`,
          }} />
          {timeline.map((item, i) => {
            const s = spring({ frame: frame - 80 - i * 25, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 24, marginBottom: 40,
                opacity: s, transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)`,
              }}>
                <div style={{ position: "relative" }}>
                  {/* Dot */}
                  <div style={{
                    position: "absolute", right: -33, top: 8,
                    width: 16, height: 16, borderRadius: "50%",
                    background: item.color, boxShadow: `0 0 16px ${item.color}40`,
                  }} />
                </div>
                <GlassCard frame={frame} fps={fps} dark={dark} delay={80 + i * 25} style={{ flex: 1 }}>
                  <div style={{ fontFamily: mono, fontSize: 13, color: item.color, marginBottom: 6 }}>{item.date}</div>
                  <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text }}>{item.event}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        {/* Compliance score */}
        <div style={{ width: 350, display: "flex", flexDirection: "column", gap: 20, alignItems: "center", justifyContent: "center" }}>
          <ProgressRing frame={frame} fps={fps} delay={70} percent={98} size={150} color={C.emerald} label="درجة الامتثال" dark={dark} />
          <div style={{ display: "flex", gap: 16 }}>
            <ProgressRing frame={frame} fps={fps} delay={90} percent={100} size={90} color={C.cyan} label="بيئي" dark={dark} />
            <ProgressRing frame={frame} fps={fps} delay={105} percent={96} size={90} color={C.indigo} label="بيانات" dark={dark} />
            <ProgressRing frame={frame} fps={fps} delay={120} percent={98} size={90} color={C.amber} label="سلامة" dark={dark} />
          </div>
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الحوكمة والامتثال" titleEn="Governance Metrics" episodeNum={15} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S3Stat frame={frame} fps={fps} dark={dark} delay={50} icon="✅" value="98%" label="نسبة الامتثال" labelEn="Compliance Rate" color={C.emerald} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={65} icon="📋" value="1,240" label="بند مراجع" labelEn="Items Audited" color={C.cyan} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🏆" value="4" label="شهادة دولية" labelEn="Certifications" color={C.amber} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📅" value="0" label="مخالفات هذا العام" labelEn="Violations This Year" color={C.indigo} />
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 50, justifyContent: "center" }}>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={110} title="Compliance Hub" />
      </div>
    </AbsoluteFill>
  );
};

const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="مستقبل الحوكمة الرقمية" titleEn="Future of Digital Governance" episodeNum={15} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
          <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="🧠" titleAr="حوكمة بالذكاء الاصطناعي" titleEn="AI-Powered Governance" desc="تحليل تلقائي للمخاطر واقتراح إجراءات تصحيحية استباقية" color={C.emerald} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="🔗" titleAr="سجل غير قابل للتعديل" titleEn="Immutable Audit Log" desc="سجل مراجعة مشفر يضمن سلامة البيانات وعدم التلاعب بها" color={C.cyan} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="🌐" titleAr="امتثال عابر للحدود" titleEn="Cross-Border Compliance" desc="دعم التشريعات المتعددة عند التوسع في أسواق جديدة تلقائياً" color={C.indigo} />
        </div>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={60} title="Governance AI" />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S3Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={540}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={490}><S3Outro frame={0} fps={30} dark={dark} episodeNum={15} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S3Background>
  );
};

export const Ep15Dark = () => <EpisodeVideo dark={true} />;
export const Ep15Light = () => <EpisodeVideo dark={false} />;
