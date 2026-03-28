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

  // Live call visualization
  const calls = [
    { caller: "مصنع النيل للبلاستيك", agent: "سارة أحمد", duration: "3:42", type: "واردة", status: "جارية", color: C.emerald },
    { caller: "شركة الأمل للنظافة", agent: "أحمد محمد", duration: "1:15", type: "واردة", status: "جارية", color: C.cyan },
    { caller: "فندق الشمس", agent: "—", duration: "0:30", type: "انتظار", status: "في الطابور", color: C.amber },
  ];

  // Animated waveform
  const wavePoints = 20;

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="مركز الاتصال الذكي" titleEn="Smart Call Center & CRM" subtitle="إدارة متكاملة لخدمة العملاء والاتصالات والعلاقات" episodeNum={14} />

      <div style={{ display: "flex", gap: 40, marginTop: 45 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          {calls.map((c, i) => {
            const s = spring({ frame: frame - 70 - i * 16, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                display: "flex", gap: 16, alignItems: "center", padding: "18px 22px",
                background: th.card, border: `1px solid ${i === 0 ? `${c.color}25` : th.borderSoft}`,
                borderRadius: 14, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [25, 0])}px)`,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {c.type === "واردة" ? "📞" : "⏳"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text }}>{c.caller}</div>
                  <div style={{ fontFamily: inter, fontSize: 12, color: th.muted }}>{c.agent !== "—" ? `Agent: ${c.agent}` : "Waiting..."}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: mono, fontSize: 16, color: c.color, fontWeight: 700 }}>{c.duration}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: c.color, padding: "2px 8px", borderRadius: 8, background: `${c.color}10` }}>{c.status}</div>
                </div>
                {/* Mini waveform for active calls */}
                {c.status === "جارية" && (
                  <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <div key={j} style={{
                        width: 3, borderRadius: 2, background: c.color,
                        height: 6 + Math.sin((frame * 0.2 + j * 1.2 + i * 3)) * 10,
                        opacity: 0.6,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live stats */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16 }}>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={80}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, direction: "rtl", marginBottom: 10 }}>🟢 مكالمات نشطة الآن</div>
            <AnimCounter frame={frame} fps={fps} delay={90} target={24} size={40} />
          </GlassCard>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={95}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, direction: "rtl", marginBottom: 10 }}>⏱️ متوسط وقت الانتظار</div>
            <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 700, color: C.cyan }}>0:45</div>
          </GlassCard>
          <GlassCard frame={frame} fps={fps} dark={dark} delay={110}>
            <div style={{ fontFamily: cairo, fontSize: 14, color: th.muted, direction: "rtl", marginBottom: 10 }}>📊 رضا العملاء اليوم</div>
            <AnimCounter frame={frame} fps={fps} delay={120} target={94} suffix="%" size={36} color={C.emerald} />
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="مميزات مركز الاتصال" titleEn="Call Center Features" episodeNum={14} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 50 }}>
        <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="🤖" titleAr="رد آلي ذكي بالذكاء الاصطناعي" titleEn="AI Auto-Response" desc="نظام رد تلقائي يفهم استفسارات العملاء ويقدم إجابات دقيقة باللغتين" color={C.emerald} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="📝" titleAr="تسجيل وتحليل المكالمات" titleEn="Call Recording & Analysis" desc="تسجيل تلقائي مع تحليل المشاعر واستخراج النقاط الرئيسية بالذكاء الاصطناعي" color={C.cyan} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="🔄" titleAr="توجيه ذكي للمكالمات" titleEn="Smart Call Routing" desc="توجيه المكالمات تلقائياً للموظف المناسب بناءً على التخصص واللغة والتقييم" color={C.indigo} />
        <S3Feature frame={frame} fps={fps} dark={dark} delay={110} icon="📊" titleAr="مؤشرات الأداء الحية" titleEn="Live KPI Dashboard" desc="متابعة لحظية لأداء كل موظف ومستوى الخدمة وأوقات الاستجابة" color={C.amber} />
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t(dark);

  // CRM pipeline
  const stages = [
    { name: "استفسار جديد", count: 45, color: C.emerald, icon: "💬" },
    { name: "متابعة", count: 28, color: C.cyan, icon: "🔄" },
    { name: "عرض سعر", count: 15, color: C.indigo, icon: "💰" },
    { name: "تعاقد", count: 8, color: C.amber, icon: "📄" },
    { name: "تنفيذ", count: 12, color: C.teal, icon: "✅" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إدارة علاقات العملاء" titleEn="Customer Relationship Management" episodeNum={14} />
      <div style={{ marginTop: 50 }}>
        {/* Pipeline */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {stages.map((st, i) => {
            const s = spring({ frame: frame - 60 - i * 12, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                flex: 1, textAlign: "center", opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
              }}>
                <GlassCard frame={frame} fps={fps} dark={dark} delay={60 + i * 12} style={{ padding: "20px 16px" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{st.icon}</div>
                  <div style={{ fontFamily: cairo, fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 6 }}>{st.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: st.color }}>{st.count}</div>
                </GlassCard>
                {i < stages.length - 1 && (
                  <div style={{ fontFamily: inter, fontSize: 20, color: th.muted, marginTop: 10, opacity: s }}>→</div>
                )}
              </div>
            );
          })}
        </div>
        {/* Bottom stats */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
          <ProgressRing frame={frame} fps={fps} delay={120} percent={89} size={120} color={C.emerald} label="معدل التحويل" dark={dark} />
          <ProgressRing frame={frame} fps={fps} delay={135} percent={95} size={120} color={C.cyan} label="رضا العملاء" dark={dark} />
          <ProgressRing frame={frame} fps={fps} delay={150} percent={82} size={120} color={C.indigo} label="حل من أول اتصال" dark={dark} />
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
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="إحصائيات مركز الاتصال" titleEn="Call Center Metrics" episodeNum={14} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S3Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📞" value="15K+" label="مكالمة شهرية" labelEn="Monthly Calls" color={C.emerald} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="< 30s" label="متوسط الرد" labelEn="Avg Response" color={C.cyan} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={80} icon="⭐" value="4.8/5" label="تقييم الخدمة" labelEn="Service Rating" color={C.amber} />
        <S3Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🤖" value="60%" label="رد آلي ناجح" labelEn="AI Resolution" color={C.indigo} />
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 50, justifyContent: "center" }}>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={110} title="Call Center Live" />
      </div>
    </AbsoluteFill>
  );
};

const Scene5 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S3Header frame={frame} fps={fps} dark={dark} titleAr="قنوات الدعم المتكاملة" titleEn="Omnichannel Support" episodeNum={14} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
          <S3Feature frame={frame} fps={fps} dark={dark} delay={50} icon="💬" titleAr="دردشة مباشرة على الموقع" titleEn="Live Website Chat" desc="شات بوت ذكي يعمل على مدار الساعة مع إمكانية التحويل لموظف متاح" color={C.emerald} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={70} icon="📱" titleAr="واتساب بيزنس" titleEn="WhatsApp Business" desc="دعم العملاء عبر واتساب مع ردود تلقائية وقوالب رسائل جاهزة" color={C.teal} />
          <S3Feature frame={frame} fps={fps} dark={dark} delay={90} icon="📧" titleAr="نظام التذاكر" titleEn="Ticket System" desc="إدارة شاملة لتذاكر الدعم مع تصنيف تلقائي وتصعيد ذكي" color={C.indigo} />
        </div>
        <S3Dashboard frame={frame} fps={fps} dark={dark} delay={60} title="Support Hub" />
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
        <TransitionSeries.Sequence durationInFrames={550}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene4 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene5 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={490}><S3Outro frame={0} fps={30} dark={dark} episodeNum={14} nextTitle="Compliance & Governance" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S3Background>
  );
};

export const Ep14Dark = () => <EpisodeVideo dark={true} />;
export const Ep14Light = () => <EpisodeVideo dark={false} />;
