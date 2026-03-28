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

  const transactions = [
    { type: "إيداع", amount: "+25,000 ج.م", ref: "DEP-4521", status: "مكتمل", color: C.emerald, icon: "💰" },
    { type: "فاتورة", amount: "-8,500 ج.م", ref: "INV-892", status: "مدفوع", color: C.cyan, icon: "📄" },
    { type: "تسوية", amount: "+12,300 ج.م", ref: "SET-156", status: "جاري", color: C.amber, icon: "🔄" },
    { type: "مرتجع", amount: "+3,200 ج.م", ref: "RFD-078", status: "مراجعة", color: C.indigo, icon: "↩️" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="الإدارة المالية المتكاملة" titleEn="Integrated Financial Management" subtitle="إدارة شاملة للفواتير والمدفوعات والتسويات المالية" episodeNum={12} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {transactions.map((tx, i) => {
            const s = spring({ frame: frame - 70 - i * 16, fps, config: { damping: 18, stiffness: 160 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 16, alignItems: "center",
                background: th.card, border: `1px solid ${th.borderSoft}`,
                borderRadius: 14, padding: "18px 24px",
                opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              }}>
                <div style={{ fontSize: 28 }}>{tx.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text }}>{tx.type}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: th.muted }}>{tx.ref}</div>
                </div>
                <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: tx.amount.startsWith("+") ? C.emerald : C.rose }}>{tx.amount}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: tx.color, padding: "4px 12px", borderRadius: 12, background: `${tx.color}12`, border: `1px solid ${tx.color}20` }}>{tx.status}</div>
              </div>
            );
          })}
        </div>
        <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 20, justifyContent: "center" }}>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={90}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, marginBottom: 8, direction: "rtl" }}>الرصيد الحالي</div>
            <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 700, color: C.emerald }}><AnimCounter frame={frame} fps={fps} delay={100} target={847250} suffix=" ج.م" size={32} /></div>
          </GlassCard>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={110}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, marginBottom: 8, direction: "rtl" }}>مستحقات معلقة</div>
            <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: C.amber }}><AnimCounter frame={frame} fps={fps} delay={120} target={156800} suffix=" ج.م" size={26} /></div>
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="نظام الفواتير الآلي" titleEn="Automated Invoicing System" episodeNum={12} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 50 }}>
        <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="🧾" titleAr="إصدار فواتير تلقائي" titleEn="Auto Invoice Generation" desc="إنشاء فواتير تلقائية عند اكتمال الشحنات مع حساب القيم والضرائب آلياً" color={C.emerald} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="📋" titleAr="فواتير تجميعية" titleEn="Aggregate Invoices" desc="تجميع شحنات متعددة في فاتورة واحدة لتسهيل المحاسبة والمراجعة" color={C.cyan} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="✍️" titleAr="توقيع إلكتروني معتمد" titleEn="Digital Signatures" desc="توقيعات رقمية موثقة من المخولين بالتوقيع مع سجل مراجعة كامل" color={C.indigo} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={110} icon="🏦" titleAr="ربط مع البنوك" titleEn="Bank Integration" desc="مطابقة تلقائية للمدفوعات مع كشوف الحسابات البنكية" color={C.amber} />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  // Animated ledger flow
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
  const income = [120, 145, 98, 167, 189, 210];
  const expense = [85, 92, 78, 105, 112, 130];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="التحليل المالي المتقدم" titleEn="Advanced Financial Analytics" episodeNum={12} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        {/* Chart */}
        <GlassCard frame={frame} fps={fps} dark={dark} delay={50} style={{ flex: 1 }}>
          <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 20, direction: "rtl" }}>📊 الإيرادات vs المصروفات (ألف ج.م)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200, paddingBottom: 30, position: "relative" }}>
            {months.map((m, i) => {
              const s = spring({ frame: frame - 70 - i * 10, fps, config: { damping: 16 } });
              const incH = income[i] * s / 2.1;
              const expH = expense[i] * s / 2.1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 160 }}>
                    <div style={{ width: 20, height: incH, background: `linear-gradient(180deg, ${C.emerald}, ${C.emerald}60)`, borderRadius: "4px 4px 0 0" }} />
                    <div style={{ width: 20, height: expH, background: `linear-gradient(180deg, ${C.rose}80, ${C.rose}40)`, borderRadius: "4px 4px 0 0" }} />
                  </div>
                  <div style={{ fontFamily: cairo, fontSize: 11, color: th.muted }}>{m}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: C.emerald }} /><span style={{ fontFamily: cairo, fontSize: 13, color: th.muted }}>إيرادات</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: `${C.rose}80` }} /><span style={{ fontFamily: cairo, fontSize: 13, color: th.muted }}>مصروفات</span></div>
          </div>
        </GlassCard>

        <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 20 }}>
          <ProgressRing frame={frame} fps={fps} delay={80} percent={94} size={130} color={C.emerald} label="نسبة التحصيل" dark={dark} />
          <ProgressRing frame={frame} fps={fps} delay={100} percent={78} size={130} color={C.cyan} label="كفاءة الإنفاق" dark={dark} />
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الأداء المالي" titleEn="Financial Performance" episodeNum={12} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center", flexWrap: "wrap" }}>
        <S3Stat frame={frame} fps={fps} dark={dark} delay={50} icon="💰" value="12.4M" label="حجم المعاملات" labelEn="Transaction Volume" color={C.emerald} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🧾" value="8,420" label="فاتورة صادرة" labelEn="Invoices Issued" color={C.cyan} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⏱️" value="< 24h" label="وقت التسوية" labelEn="Settlement Time" color={C.indigo} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📉" value="-40%" label="تقليل الأخطاء" labelEn="Error Reduction" color={C.amber} />
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 50, justifyContent: "center" }}>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={110} title="Financial Dashboard" />
      </div>
    </AbsoluteFill>
  );
};

const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="أمان مالي متقدم" titleEn="Advanced Financial Security" episodeNum={12} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
          <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="🔐" titleAr="تشفير من طرف لطرف" titleEn="End-to-End Encryption" desc="حماية كاملة لجميع البيانات المالية والمعاملات عبر المنصة" color={C.emerald} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="👁️" titleAr="سجل مراجعة شامل" titleEn="Complete Audit Trail" desc="تتبع كل عملية مالية مع تسجيل المستخدم والوقت والتفاصيل" color={C.cyan} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="🛡️" titleAr="كشف الاحتيال بالذكاء الاصطناعي" titleEn="AI Fraud Detection" desc="خوارزميات متقدمة لرصد الأنماط المشبوهة والتنبيه الفوري" color={C.rose} />
        </div>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={60} title="Security Monitor" />
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
        <TransitionSeries.Sequence durationInFrames={550}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={490}><S3Outro frame={0} fps={30} dark={dark} episodeNum={12} nextTitle="Workforce Management" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S3Background>
  );
};

export const Ep12Dark = () => <EpisodeVideo dark={true} />;
export const Ep12Light = () => <EpisodeVideo dark={false} />;
