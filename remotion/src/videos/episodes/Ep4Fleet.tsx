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
  const bgHue = interpolate(frame, [0, 1350], [195, 155]);
  const bgAngle = interpolate(frame, [0, 1350], [130, 170]);

  return (
    <AbsoluteFill style={{
      background: isDark
        ? `linear-gradient(${bgAngle}deg, ${C.bg1} 0%, hsl(${bgHue}, 35%, 7%) 40%, ${C.bg1} 100%)`
        : `linear-gradient(${bgAngle}deg, #f0f5fa 0%, hsl(${bgHue}, 30%, 96%) 50%, #f5faf0 100%)`,
      fontFamily: cairo,
    }}>
      <GridOverlay frame={frame} C={C} />
      <Particles frame={frame} C={C} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={200}>
          <LogoIntro C={C} episodeNum={4} titleAr="إدارة الأسطول والسائقين" titleEn="Fleet & Driver Management" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_FleetOverview C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_DriverManagement C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_LiveMap C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Maintenance C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <LogoOutro C={C} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ── Scene: Fleet Overview ──
const Scene_FleetOverview: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const vehicles = [
    { type: "🚛", name: "شاحنة ثقيلة", count: "18", status: "نشط", plate: "أ ب ج 1234" },
    { type: "🚚", name: "شاحنة متوسطة", count: "24", status: "نشط", plate: "د هـ و 5678" },
    { type: "🛻", name: "بيك أب", count: "12", status: "صيانة", plate: "ز ح ط 9012" },
    { type: "🏍️", name: "موتوسيكل", count: "8", status: "نشط", plate: "ي ك ل 3456" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="أسطول متكامل تحت سيطرتك" en="Your Complete Fleet Under Control" C={C} frame={frame} fps={fps} size={50} />
      </div>

      {/* Stats row */}
      <div style={{ position: "absolute", top: 180, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          { val: "62", label: "إجمالي المركبات", icon: "🚛", color: C.primary },
          { val: "48", label: "مركبة نشطة", icon: "✅", color: "#22c55e" },
          { val: "8", label: "في صيانة", icon: "🔧", color: C.gold },
          { val: "6", label: "متوقفة", icon: "⏸️", color: C.muted },
        ].map((stat, i) => {
          const s = spring({ frame: frame - 10 - i * 10, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              padding: "20px 30px", borderRadius: 18, textAlign: "center",
              background: isDark ? C.card : "#fff",
              border: `1px solid ${stat.color}30`,
              opacity: s, transform: `scale(${s})`,
              boxShadow: isDark ? `0 0 20px ${stat.color}10` : `0 4px 15px ${stat.color}08`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: stat.color, fontFamily: inter }}>{stat.val}</div>
              <div style={{ fontSize: 16, color: C.muted, fontFamily: cairo }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Vehicle cards */}
      <div style={{ position: "absolute", top: 440, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24, direction: "rtl" }}>
        {vehicles.map((v, i) => {
          const s = spring({ frame: frame - 60 - i * 15, fps, config: { damping: 12 } });
          return (
            <div key={i} style={{
              width: 360, padding: "24px 20px", borderRadius: 20,
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              display: "flex", alignItems: "center", gap: 16,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 50, flexShrink: 0 }}>{v.type}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo }}>{v.name}</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: cairo }}>العدد: {v.count} • لوحة: {v.plate}</div>
                <div style={{
                  display: "inline-block", marginTop: 6, padding: "3px 12px", borderRadius: 12,
                  background: v.status === "نشط" ? "#22c55e20" : `${C.gold}20`,
                  color: v.status === "نشط" ? "#22c55e" : C.gold,
                  fontSize: 13, fontWeight: 700, fontFamily: cairo,
                }}>{v.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Driver Management ──
const Scene_DriverManagement: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const drivers = [
    { name: "أحمد محمد علي", role: "سائق شاحنة ثقيلة", trips: "247", rating: "4.9", status: "في مهمة", avatar: "👨‍✈️" },
    { name: "محمود حسن", role: "سائق شاحنة متوسطة", trips: "189", rating: "4.7", status: "متاح", avatar: "👨‍💼" },
    { name: "خالد إبراهيم", role: "سائق بيك أب", trips: "312", rating: "4.8", status: "في مهمة", avatar: "🧑‍✈️" },
    { name: "عمر سعيد", role: "سائق موتوسيكل", trips: "156", rating: "4.6", status: "إجازة", avatar: "👷" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="إدارة شاملة للسائقين" en="Comprehensive Driver Management" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 190, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, direction: "rtl" }}>
        {drivers.map((d, i) => {
          const s = spring({ frame: frame - 15 - i * 20, fps, config: { damping: 14 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -100 : 100, 0]);
          return (
            <div key={i} style={{
              width: 900, padding: "20px 28px", borderRadius: 20,
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              display: "flex", alignItems: "center", gap: 20,
              opacity: s, transform: `translateX(${x}px)`,
              boxShadow: isDark ? "none" : "0 4px 15px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 70, height: 70, borderRadius: "50%",
                background: `${C.primary}15`, border: `2px solid ${C.primary}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, flexShrink: 0,
              }}>{d.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, fontFamily: cairo }}>{d.name}</div>
                <div style={{ fontSize: 15, color: C.muted, fontFamily: cairo }}>{d.role}</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 16px" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.accent, fontFamily: inter }}>{d.trips}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: cairo }}>رحلة</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 16px" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.gold, fontFamily: inter }}>⭐ {d.rating}</div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: cairo }}>تقييم</div>
              </div>
              <div style={{
                padding: "6px 16px", borderRadius: 14,
                background: d.status === "متاح" ? "#22c55e20" : d.status === "إجازة" ? `${C.gold}20` : `${C.accent}20`,
                color: d.status === "متاح" ? "#22c55e" : d.status === "إجازة" ? C.gold : C.accent,
                fontSize: 15, fontWeight: 700, fontFamily: cairo, flexShrink: 0,
              }}>{d.status}</div>
            </div>
          );
        })}
      </div>

      {/* Features bottom */}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
        {[
          "📱 تطبيق السائق", "📍 تتبع لحظي", "⭐ نظام التقييم", "📊 تقارير الأداء", "🔔 إشعارات فورية"
        ].map((feat, i) => {
          const op = interpolate(frame, [130 + i * 10, 150 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "10px 20px", borderRadius: 20,
              background: `${C.primary}15`, border: `1px solid ${C.primary}30`,
              fontSize: 16, color: C.primary, fontFamily: cairo, opacity: op,
            }}>{feat}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Live Map ──
const Scene_LiveMap: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const trucks = [
    { x: 300, y: 280, label: "ش-001", dest: "القاهرة → الجيزة" },
    { x: 550, y: 400, label: "ش-002", dest: "العاشر → السويس" },
    { x: 800, y: 300, label: "ش-003", dest: "الفيوم → بني سويف" },
    { x: 1050, y: 450, label: "ش-004", dest: "الإسكندرية → المنصورة" },
    { x: 650, y: 550, label: "ش-005", dest: "أسوان → الأقصر" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="خريطة حية لكل المركبات" en="Live Fleet Map" C={C} frame={frame} fps={fps} size={50} />
      </div>

      {/* Map */}
      <div style={{
        position: "absolute", top: 180, left: 60, right: 60, height: 520,
        borderRadius: 24, background: isDark ? C.card : "#f9fafb",
        border: `2px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        overflow: "hidden",
      }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", top: i * 35, left: 0, right: 0, height: 1, background: C.primary, opacity: 0.04 }} />
            <div style={{ position: "absolute", left: i * 60, top: 0, bottom: 0, width: 1, background: C.primary, opacity: 0.03 }} />
          </React.Fragment>
        ))}

        {trucks.map((t, i) => {
          const tOp = interpolate(frame, [30 + i * 18, 50 + i * 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const moveX = Math.sin(frame * 0.02 + i * 1.5) * 15;
          const moveY = Math.cos(frame * 0.015 + i * 2) * 10;
          const pingScale = interpolate(Math.sin(frame * 0.06 + i * 2), [-1, 1], [1, 2]);

          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: t.x + moveX - 16, top: t.y + moveY - 16, width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.primary}`, transform: `scale(${pingScale})`, opacity: tOp * 0.2 }} />
              <div style={{
                position: "absolute", left: t.x + moveX - 22, top: t.y + moveY - 22,
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, opacity: tOp,
                boxShadow: `0 0 15px ${C.primary}40`,
              }}>🚛</div>
              <div style={{
                position: "absolute", left: t.x + moveX - 60, top: t.y + moveY + 28,
                width: 120, textAlign: "center", opacity: tOp,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: inter }}>{t.label}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: cairo }}>{t.dest}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 60, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30,
        opacity: interpolate(frame, [120, 145], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {[
          { color: "#22c55e", label: "في الطريق" },
          { color: C.gold, label: "تحميل/تفريغ" },
          { color: C.accent, label: "انتظار" },
          { color: "#ef4444", label: "عطل" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: item.color }} />
            <span style={{ fontSize: 15, color: C.muted, fontFamily: cairo }}>{item.label}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Maintenance ──
const Scene_Maintenance: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const maintenanceFeatures = [
    { icon: "🔧", ar: "جدولة الصيانة الدورية", en: "Scheduled Maintenance", desc: "تنبيهات تلقائية قبل موعد الصيانة بأسبوع مع تتبع سجل الصيانة الكامل" },
    { icon: "⛽", ar: "تتبع استهلاك الوقود", en: "Fuel Consumption Tracking", desc: "مراقبة دقيقة لاستهلاك الوقود لكل مركبة مع تقارير التكلفة الشهرية" },
    { icon: "📋", ar: "سجل المركبات", en: "Vehicle Records", desc: "ملف شامل لكل مركبة: الرخصة، التأمين، الفحص الدوري، وتاريخ الصيانة" },
    { icon: "⚠️", ar: "تنبيهات ذكية", en: "Smart Alerts", desc: "إشعارات فورية عند اقتراب موعد تجديد الرخصة أو التأمين أو الفحص" },
    { icon: "📊", ar: "تحليل أداء الأسطول", en: "Fleet Analytics", desc: "مؤشرات الأداء: معدل التشغيل، التكلفة لكل كيلو، ومتوسط الرحلات" },
    { icon: "🛡️", ar: "نظام السلامة", en: "Safety System", desc: "مراقبة السرعة والقيادة الآمنة مع تقارير الحوادث والمخالفات" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp, padding: "0 80px" }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", left: 0 }}>
        <BiTitle ar="صيانة وسلامة الأسطول" en="Fleet Maintenance & Safety" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 180, left: 80, right: 80, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, direction: "rtl" }}>
        {maintenanceFeatures.map((f, i) => {
          const s = spring({ frame: frame - 15 - i * 14, fps, config: { damping: 14 } });
          const y = interpolate(s, [0, 1], [40, 0]);
          return (
            <div key={i} style={{
              padding: "24px 22px", borderRadius: 20, textAlign: "center",
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              opacity: s, transform: `translateY(${y}px)`,
              boxShadow: isDark ? `0 0 15px ${C.primary}08` : "0 4px 15px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px",
                background: `${C.primary}12`, border: `1px solid ${C.primary}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32,
              }}>{f.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 4 }}>{f.ar}</div>
              <div style={{ fontSize: 13, color: C.primary, fontFamily: inter, marginBottom: 8 }}>{f.en}</div>
              <div style={{ fontSize: 14, color: C.muted, fontFamily: cairo, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Ep4Dark: React.FC = () => <Episode C={D} />;
export const Ep4Light: React.FC = () => <Episode C={L} />;
