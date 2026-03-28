import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { S2Background, SectionHeader, StatCard, FeatureItem, S2Outro, cairo, inter, mono, COLORS, theme } from "./S2Common";

const TRANS = 25;

// Scene 1: Customer Portal Overview
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  // Animated portal mockup
  const mockupS = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="بوابة العملاء الذكية" titleEn="Smart Customer Portal" subtitle="واجهة متكاملة للإدارة الذاتية والمتابعة اللحظية" episodeNum={8} />

      <div style={{ display: "flex", gap: 50, marginTop: 40 }}>
        {/* Portal mockup */}
        <div style={{
          flex: 1.2, background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 16, overflow: "hidden",
          transform: `scale(${interpolate(mockupS, [0, 1], [0.9, 1])})`, opacity: mockupS,
        }}>
          {/* Title bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
            borderBottom: `1px solid ${t.border}`,
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#EF4444", "#F59E0B", COLORS.green].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: t.muted, flex: 1, textAlign: "center" }}>portal.irecycle.app</div>
          </div>
          {/* Content area */}
          <div style={{ padding: 20 }}>
            {/* Nav tabs */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {["لوحة التحكم", "طلباتي", "شحناتي", "فواتيري", "الدعم"].map((tab, i) => {
                const tabS = spring({ frame: frame - 60 - i * 8, fps, config: { damping: 18 } });
                return (
                  <div key={i} style={{
                    fontFamily: cairo, fontSize: 13, color: i === 0 ? COLORS.green : t.muted,
                    background: i === 0 ? `${COLORS.green}12` : "transparent",
                    padding: "6px 14px", borderRadius: 6,
                    border: i === 0 ? `1px solid ${COLORS.green}25` : "none",
                    opacity: tabS,
                  }}>{tab}</div>
                );
              })}
            </div>
            {/* Mini cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📦", num: "23", label: "طلب نشط" },
                { icon: "🚛", num: "8", label: "شحنة في الطريق" },
                { icon: "💳", num: "5", label: "فاتورة معلقة" },
              ].map((item, i) => {
                const cardS = spring({ frame: frame - 90 - i * 12, fps, config: { damping: 16 } });
                return (
                  <div key={i} style={{
                    background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                    borderRadius: 8, padding: 12, textAlign: "center",
                    opacity: cardS, transform: `translateY(${interpolate(cardS, [0, 1], [20, 0])}px)`,
                  }}>
                    <div style={{ fontSize: 24 }}>{item.icon}</div>
                    <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: COLORS.green }}>{item.num}</div>
                    <div style={{ fontFamily: cairo, fontSize: 12, color: t.muted }}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features sidebar */}
        <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { icon: "🔐", title: "تسجيل دخول آمن", desc: "مصادقة ثنائية" },
            { icon: "📊", title: "لوحة تحكم شخصية", desc: "بيانات مخصصة لحسابك" },
            { icon: "🔔", title: "إشعارات فورية", desc: "تحديثات لحظية" },
            { icon: "📱", title: "متجاوب 100%", desc: "يعمل على أي جهاز" },
          ].map((f, i) => {
            const s = spring({ frame: frame - 100 - i * 15, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${COLORS.green}10`, border: `1px solid ${COLORS.green}20`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: t.text }}>{f.title}</div>
                  <div style={{ fontFamily: cairo, fontSize: 12, color: t.muted }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Self-service features
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { titleAr: "تتبع الشحنات لحظياً", titleEn: "Real-time Shipment Tracking", desc: "متابعة موقع كل شحنة على الخريطة مع تحديثات تلقائية وتوقيت وصول تقديري", color: COLORS.green },
    { titleAr: "طلبات جديدة بنقرة", titleEn: "One-Click Orders", desc: "إنشاء طلبات جمع جديدة بسهولة مع اختيار الموعد والنوع والكمية", color: COLORS.blue },
    { titleAr: "فواتير ومدفوعات", titleEn: "Invoices & Payments", desc: "عرض وتحميل الفواتير والدفع الإلكتروني المباشر عبر البوابة", color: "#F59E0B" },
    { titleAr: "تقارير بيئية مخصصة", titleEn: "Custom Environmental Reports", desc: "تقارير تفصيلية عن كميات المخلفات وأثرك البيئي وشهادات التخلص", color: "#8B5CF6" },
    { titleAr: "دعم فني مباشر", titleEn: "Live Support Chat", desc: "تواصل مباشر مع فريق الدعم عبر المحادثة أو تذاكر الدعم", color: "#EC4899" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="خدمات ذاتية متكاملة" titleEn="Complete Self-Service" episodeNum={8} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40 }}>
        {features.map((f, i) => (
          <FeatureItem key={i} frame={frame} fps={fps} dark={dark} delay={30 + i * 16} titleAr={f.titleAr} titleEn={f.titleEn} desc={f.desc} color={f.color} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Stats
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="تجربة عملاء استثنائية" titleEn="Exceptional Customer Experience" episodeNum={8} />
      <div style={{ display: "flex", gap: 24, marginTop: 50, justifyContent: "center", flexWrap: "wrap" }}>
        <StatCard frame={frame} fps={fps} dark={dark} delay={30} icon="⭐" value="4.9/5" label="تقييم العملاء" labelEn="Customer Rating" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={45} icon="🕐" value="<30s" label="وقت الاستجابة" labelEn="Response Time" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={60} icon="📱" value="85%" label="استخدام الموبايل" labelEn="Mobile Usage" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={75} icon="🔄" value="94%" label="معدل العودة" labelEn="Return Rate" />
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <S2Outro frame={frame} fps={fps} dark={dark} episodeNum={8} nextTitle="API Integration" />;
};

const Ep8Content = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S2Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={650}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={580}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={480}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={400}><Scene4 dark={dark} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S2Background>
  );
};

export const Ep8Dark = () => <Ep8Content dark />;
export const Ep8Light = () => <Ep8Content dark={false} />;
