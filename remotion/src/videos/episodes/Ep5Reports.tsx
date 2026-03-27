import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { D, L, Theme, cairo, inter, LogoIntro, LogoOutro, BiTitle, GridOverlay, Particles } from "./shared";

const TRANS = 25;

const Episode: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const isDark = C.bg1 === D.bg1;
  const bgHue = interpolate(frame, [0, 1350], [175, 210]);
  const bgAngle = interpolate(frame, [0, 1350], [140, 160]);

  return (
    <AbsoluteFill style={{
      background: isDark
        ? `linear-gradient(${bgAngle}deg, ${C.bg1} 0%, hsl(${bgHue}, 35%, 7%) 40%, ${C.bg1} 100%)`
        : `linear-gradient(${bgAngle}deg, #f0faf5 0%, hsl(${bgHue}, 30%, 96%) 50%, #f5f7fa 100%)`,
      fontFamily: cairo,
    }}>
      <GridOverlay frame={frame} C={C} />
      <Particles frame={frame} C={C} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={200}>
          <LogoIntro C={C} episodeNum={5} titleAr="التقارير ولوحة التحكم" titleEn="Reports & Dashboard" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={230}>
          <Scene_Dashboard C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Reports C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Analytics C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene_ExportShare C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <LogoOutro C={C} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ── Scene: Dashboard ──
const Scene_Dashboard: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [200, 230], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const screenGlow = interpolate(Math.sin(frame * 0.05), [-1, 1], [5, 25]);
  const scrollY = interpolate(frame, [60, 200], [0, -250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center" }}>
        <BiTitle ar="لوحة تحكم تفاعلية" en="Interactive Dashboard" C={C} frame={frame} fps={fps} size={48} />
      </div>

      {/* Laptop mockup */}
      <div style={{
        position: "absolute", left: "50%", top: 170, transform: "translateX(-50%)",
        opacity: interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          width: 1100, height: 640, borderRadius: 16,
          background: isDark ? "#111827" : "#fafafa",
          border: `2px solid ${isDark ? "#374151" : "#e5e7eb"}`,
          overflow: "hidden",
          boxShadow: isDark ? `0 0 ${screenGlow}px ${C.primary}30, 0 30px 80px rgba(0,0,0,0.5)` : "0 20px 60px rgba(0,0,0,0.1)",
        }}>
          <div style={{ transform: `translateY(${scrollY}px)`, padding: 24 }}>
            {/* Top bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 20px", background: isDark ? "#0f2a1a" : "#f0fdf4", borderRadius: 12, marginBottom: 20,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.primary, fontFamily: inter }}>iRecycle Dashboard</div>
              <div style={{ fontSize: 16, color: C.muted, fontFamily: cairo }}>مارس 2025 • March 2025</div>
            </div>

            {/* KPI cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              {[
                { label: "إجمالي الشحنات", en: "Total Shipments", val: "3,847", change: "+12%", color: C.primary },
                { label: "الأوزان المجمعة", en: "Total Weight", val: "1,250 طن", change: "+8%", color: C.accent },
                { label: "الإيرادات", en: "Revenue", val: "₤2.5M", change: "+15%", color: C.gold },
                { label: "معدل الإنجاز", en: "Completion Rate", val: "97.3%", change: "+2%", color: "#22c55e" },
                { label: "رضا العملاء", en: "Satisfaction", val: "4.8/5", change: "+0.3", color: "#a78bfa" },
              ].map((kpi, i) => {
                const cardOp = interpolate(frame, [30 + i * 10, 50 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={i} style={{
                    flex: 1, padding: 16, borderRadius: 14,
                    background: isDark ? `linear-gradient(135deg, #0f2a1a, #0a1f12)` : "#fff",
                    border: `1px solid ${kpi.color}20`,
                    opacity: cardOp,
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, fontFamily: cairo }}>{kpi.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: inter, opacity: 0.7 }}>{kpi.en}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color, fontFamily: inter, marginTop: 6 }}>{kpi.val}</div>
                    <div style={{ fontSize: 13, color: "#22c55e", fontFamily: inter, marginTop: 2 }}>▲ {kpi.change}</div>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              {/* Bar chart */}
              <div style={{
                flex: 2, height: 220, borderRadius: 14,
                background: isDark ? "#0f2a1a" : "#fff",
                border: `1px solid ${isDark ? "#1a4a2e" : "#e5e7eb"}`,
                padding: 18,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 12 }}>الأداء الشهري • Monthly Performance</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                  {[55, 72, 48, 85, 63, 90, 78, 95, 68, 88, 76, 92].map((h, i) => {
                    const barH = interpolate(frame, [60 + i * 5, 85 + i * 5], [0, h * 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", height: barH, borderRadius: 4, background: `linear-gradient(0deg, ${C.primary}80, ${C.primaryLight})` }} />
                        <span style={{ fontSize: 9, color: C.muted }}>{["ي", "ف", "م", "أ", "م", "ي", "ي", "أ", "س", "أ", "ن", "د"][i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pie chart */}
              <div style={{
                flex: 1, height: 220, borderRadius: 14,
                background: isDark ? "#0f2a1a" : "#fff",
                border: `1px solid ${isDark ? "#1a4a2e" : "#e5e7eb"}`,
                padding: 18, display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 12, width: "100%" }}>أنواع المخلفات</div>
                <div style={{ position: "relative", width: 120, height: 120 }}>
                  <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, transform: "rotate(-90deg)" }}>
                    {[
                      { pct: 35, color: C.primary },
                      { pct: 25, color: C.accent },
                      { pct: 20, color: C.gold },
                      { pct: 20, color: "#a78bfa" },
                    ].reduce((acc, seg, i) => {
                      const offset = acc.offset;
                      const circumference = 2 * Math.PI * 40;
                      const dashLen = (seg.pct / 100) * circumference;
                      const animPct = interpolate(frame, [70 + i * 15, 100 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                      acc.elements.push(
                        <circle key={i} cx="50" cy="50" r="40" fill="none"
                          stroke={seg.color} strokeWidth="18"
                          strokeDasharray={`${dashLen * animPct} ${circumference}`}
                          strokeDashoffset={-offset} />
                      );
                      acc.offset = offset + dashLen;
                      return acc;
                    }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                  </svg>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    { label: "صناعية", color: C.primary },
                    { label: "بناء", color: C.accent },
                    { label: "عضوية", color: C.gold },
                    { label: "أخرى", color: "#a78bfa" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontSize: 10, color: C.muted, fontFamily: cairo }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent shipments table */}
            <div style={{
              borderRadius: 14, background: isDark ? "#0f2a1a" : "#fff",
              border: `1px solid ${isDark ? "#1a4a2e" : "#e5e7eb"}`,
              padding: 18,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 12 }}>آخر الشحنات • Recent Shipments</div>
              {[
                "SHP-0847 | شركة التوحيد → مصنع الحديد والصلب | 2.5 طن | مكتمل ✅",
                "SHP-0846 | المنطقة الصناعية → محطة التدوير المركزية | 1.8 طن | قيد التنفيذ 🚛",
                "SHP-0845 | مجمع الشركات → مركز الفرز والتصنيف | 3.2 طن | جديد 📋",
              ].map((row, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 6,
                  background: isDark ? (i % 2 === 0 ? "#0a1f12" : "transparent") : (i % 2 === 0 ? "#f9fafb" : "transparent"),
                  fontSize: 13, color: C.muted, fontFamily: cairo,
                  opacity: interpolate(frame, [100 + i * 10, 115 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}>{row}</div>
              ))}
            </div>
          </div>
        </div>
        {/* Laptop base */}
        <div style={{
          width: 1200, height: 20, marginLeft: -50, borderRadius: "0 0 14px 14px",
          background: isDark ? "linear-gradient(180deg, #374151, #1f2937)" : "linear-gradient(180deg, #d1d5db, #9ca3af)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Reports Types ──
const Scene_Reports: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const reports = [
    { icon: "📊", ar: "تقرير الأداء الشهري", en: "Monthly Performance Report", desc: "ملخص شامل للشحنات والأوزان والإيرادات مع مقارنة بالشهور السابقة" },
    { icon: "🏢", ar: "تقرير الجهات", en: "Organization Report", desc: "تفاصيل أداء كل جهة: عدد الشحنات، الأوزان، المستحقات والمدفوعات" },
    { icon: "🚛", ar: "تقرير الأسطول", en: "Fleet Report", desc: "أداء المركبات والسائقين: الرحلات، الوقود، الصيانة، والمخالفات" },
    { icon: "♻️", ar: "تقرير بيئي", en: "Environmental Report", desc: "التأثير البيئي: كميات المخلفات المدورة، انبعاثات CO₂ المُوفرة" },
    { icon: "💰", ar: "تقرير مالي", en: "Financial Report", desc: "الإيرادات والمصروفات والأرباح مع تحليل التدفق النقدي" },
    { icon: "📈", ar: "تقرير تنبؤي", en: "Forecast Report", desc: "توقعات الطلب المستقبلي بناءً على تحليل البيانات التاريخية بالذكاء الاصطناعي" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="تقارير شاملة لكل شيء" en="Comprehensive Reports for Everything" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 190, left: 80, right: 80, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, direction: "rtl" }}>
        {reports.map((r, i) => {
          const s = spring({ frame: frame - 15 - i * 14, fps, config: { damping: 14 } });
          const hover = interpolate(Math.sin(frame * 0.03 + i * 1.2), [-1, 1], [-3, 3]);
          return (
            <div key={i} style={{
              padding: "28px 24px", borderRadius: 22, textAlign: "center",
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0]) + hover}px)`,
              boxShadow: isDark ? `0 0 15px ${C.primary}08` : "0 4px 15px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 70, height: 70, borderRadius: 20, margin: "0 auto 14px",
                background: `${C.primary}12`, border: `1px solid ${C.primary}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
              }}>{r.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 4 }}>{r.ar}</div>
              <div style={{ fontSize: 14, color: C.primary, fontFamily: inter, marginBottom: 8 }}>{r.en}</div>
              <div style={{ fontSize: 15, color: C.muted, fontFamily: cairo, lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Advanced Analytics ──
const Scene_Analytics: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="تحليلات متقدمة لاتخاذ قرارات أذكى" en="Advanced Analytics for Smarter Decisions" C={C} frame={frame} fps={fps} size={46} />
      </div>

      {/* Big numbers */}
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40 }}>
        {[
          { val: "3,847", label: "شحنة هذا الشهر", en: "Shipments This Month", color: C.primary },
          { val: "1,250", label: "طن مخلفات", en: "Tons of Waste", color: C.accent },
          { val: "₤2.5M", label: "إيرادات الربع", en: "Quarterly Revenue", color: C.gold },
          { val: "97.3%", label: "معدل الإنجاز", en: "Completion Rate", color: "#22c55e" },
        ].map((stat, i) => {
          const s = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 12 } });
          const counterEnd = parseFloat(stat.val.replace(/[^0-9.]/g, "")) || 0;
          const counter = interpolate(frame, [20 + i * 12, 70 + i * 12], [0, counterEnd], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pulse = interpolate(Math.sin(frame * 0.04 + i), [-1, 1], [0.97, 1.03]);
          return (
            <div key={i} style={{
              width: 300, padding: 28, borderRadius: 22, textAlign: "center",
              background: isDark ? C.card : "#fff",
              border: `1px solid ${stat.color}25`,
              transform: `scale(${s * pulse})`,
              boxShadow: isDark ? `0 0 25px ${stat.color}12` : `0 8px 25px ${stat.color}08`,
            }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: stat.color, fontFamily: inter, textShadow: isDark ? `0 0 20px ${stat.color}30` : "none" }}>
                {stat.val.includes("%") || stat.val.includes("₤") || stat.val.includes("M")
                  ? stat.val
                  : `${Math.floor(counter).toLocaleString()}`
                }
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo, marginTop: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 14, color: C.muted, fontFamily: inter }}>{stat.en}</div>
            </div>
          );
        })}
      </div>

      {/* Trend lines area */}
      <div style={{
        position: "absolute", bottom: 100, left: 120, right: 120, height: 250,
        borderRadius: 20, background: isDark ? C.card : "#fff",
        border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        padding: 24, display: "flex", flexDirection: "column",
        opacity: interpolate(frame, [80, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 4 }}>اتجاهات الأداء • Performance Trends</div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 3 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 40 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 15 + i * 2;
            const barH = interpolate(frame, [100 + i * 2, 120 + i * 2], [0, h], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{
                flex: 1, height: barH, borderRadius: 3,
                background: `linear-gradient(0deg, ${C.primary}60, ${C.primaryLight})`,
              }} />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Export & Share ──
const Scene_ExportShare: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [180, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const exportOptions = [
    { icon: "📄", ar: "تصدير PDF", en: "Export as PDF", desc: "تقارير PDF احترافية مع شعار المنصة والألوان الرسمية" },
    { icon: "📊", ar: "تصدير Excel", en: "Export as Excel", desc: "بيانات تفصيلية في جداول Excel قابلة للتعديل والتحليل" },
    { icon: "📧", ar: "إرسال بالبريد", en: "Email Report", desc: "إرسال التقارير تلقائياً للمسؤولين في مواعيد محددة" },
    { icon: "📱", ar: "مشاركة واتساب", en: "Share via WhatsApp", desc: "مشاركة ملخصات سريعة مع الفريق عبر واتساب" },
    { icon: "🖨️", ar: "طباعة مباشرة", en: "Print Ready", desc: "تنسيق جاهز للطباعة مع رؤوس وتذييلات مخصصة" },
    { icon: "🔄", ar: "جدولة تلقائية", en: "Auto-Schedule", desc: "تقارير دورية تُرسل أسبوعياً وشهرياً تلقائياً" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="تصدير ومشاركة بكل الطرق" en="Export & Share Every Way" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 190, left: 80, right: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, direction: "rtl" }}>
        {exportOptions.map((opt, i) => {
          const s = spring({ frame: frame - 15 - i * 14, fps, config: { damping: 14 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -60 : 60, 0]);
          return (
            <div key={i} style={{
              display: "flex", gap: 18, padding: "22px 24px", borderRadius: 20,
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              opacity: s, transform: `translateX(${x}px)`,
              boxShadow: isDark ? "none" : "0 4px 15px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `${C.primary}12`, border: `1px solid ${C.primary}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, flexShrink: 0,
              }}>{opt.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: cairo }}>{opt.ar}</div>
                <div style={{ fontSize: 14, color: C.primary, fontFamily: inter, marginBottom: 4 }}>{opt.en}</div>
                <div style={{ fontSize: 15, color: C.muted, fontFamily: cairo, lineHeight: 1.5 }}>{opt.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Ep5Dark: React.FC = () => <Episode C={D} />;
export const Ep5Light: React.FC = () => <Episode C={L} />;
