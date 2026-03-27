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
  const bgHue = interpolate(frame, [0, 1350], [155, 195]);
  const bgAngle = interpolate(frame, [0, 1350], [135, 165]);

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
          <LogoIntro C={C} episodeNum={2} titleAr="كيف تعمل الشحنات؟" titleEn="How Shipments Work" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_ShipmentLifecycle C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Tracking C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Invoicing C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_Notifications C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <LogoOutro C={C} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ── Scene: Shipment Lifecycle ──
const Scene_ShipmentLifecycle: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const steps = [
    { icon: "📝", ar: "إنشاء الشحنة", en: "Create Shipment", desc: "تحديد المولّد والناقل ونوع المخلفات والكمية", color: C.primary },
    { icon: "✅", ar: "الموافقة والجدولة", en: "Approve & Schedule", desc: "مراجعة البيانات وتعيين السائق والمركبة", color: C.accent },
    { icon: "🚛", ar: "بدء النقل", en: "Start Transport", desc: "تتبع GPS مباشر مع تحديثات لحظية", color: C.gold },
    { icon: "⚖️", ar: "الوزن والتسليم", en: "Weigh & Deliver", desc: "تسجيل الوزن الفعلي وتوثيق التسليم بالصور", color: "#a78bfa" },
    { icon: "📄", ar: "الفوترة التلقائية", en: "Auto-Invoicing", desc: "إصدار فاتورة إلكترونية وشهادة تخلص آمن", color: "#f472b6" },
  ];

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Progress line
  const lineProgress = interpolate(frame, [20, 160], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <BiTitle ar="دورة حياة الشحنة" en="Shipment Lifecycle" C={C} frame={frame} fps={fps} size={50} />
      </div>

      {/* Vertical timeline */}
      <div style={{ position: "absolute", left: 200, top: 200, bottom: 80 }}>
        <div style={{
          position: "absolute", left: 24, top: 0, width: 4, borderRadius: 2,
          height: `${lineProgress}%`,
          background: `linear-gradient(180deg, ${C.primary}, ${C.accent}, ${C.gold})`,
          boxShadow: `0 0 15px ${C.primary}40`,
        }} />
      </div>

      {steps.map((step, i) => {
        const delay = 25 + i * 25;
        const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
        const x = interpolate(s, [0, 1], [80, 0]);
        const y = 210 + i * 140;

        return (
          <div key={i} style={{
            position: "absolute", left: 260, top: y,
            display: "flex", alignItems: "center", gap: 24,
            opacity: s, transform: `translateX(${x}px)`,
          }}>
            {/* Dot on timeline */}
            <div style={{
              position: "absolute", left: -85, width: 24, height: 24, borderRadius: "50%",
              background: step.color, boxShadow: `0 0 12px ${step.color}60`,
              border: `3px solid ${isDark ? C.bg1 : "#fff"}`,
            }} />

            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: `${step.color}${isDark ? "18" : "10"}`,
              border: `2px solid ${step.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38, flexShrink: 0,
            }}>{step.icon}</div>

            {/* Text */}
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.white, fontFamily: cairo }}>{step.ar}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: step.color, fontFamily: inter }}>{step.en}</div>
              <div style={{ fontSize: 18, color: C.muted, fontFamily: cairo, marginTop: 4, lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          </div>
        );
      })}

      {/* Right side — Phone mockup */}
      <div style={{ position: "absolute", right: 80, top: 250, opacity: interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{
          width: 320, height: 580, borderRadius: 32,
          background: isDark ? "#111827" : "#f9fafb", border: `3px solid ${isDark ? "#374151" : "#e5e7eb"}`,
          overflow: "hidden", boxShadow: isDark ? `0 0 20px ${C.primary}20, 0 20px 60px rgba(0,0,0,0.4)` : `0 10px 40px rgba(0,0,0,0.1)`,
        }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 110, height: 26, borderRadius: "0 0 14px 14px", background: isDark ? "#000" : "#e5e7eb", zIndex: 10 }} />
          <div style={{ padding: "40px 16px 16px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, fontFamily: inter, textAlign: "center", marginBottom: 14 }}>تفاصيل الشحنة</div>
            {[
              { label: "رقم الشحنة", val: "SHP-2024-0847" },
              { label: "المولّد", val: "شركة التوحيد البيئية" },
              { label: "الناقل", val: "أسطول النيل" },
              { label: "نوع المخلفات", val: "مخلفات صناعية" },
              { label: "الوزن المتوقع", val: "2.5 طن" },
              { label: "الحالة", val: "قيد النقل 🚛" },
            ].map((item, i) => {
              const itemOp = interpolate(frame, [80 + i * 12, 100 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 12px",
                  borderRadius: 10, marginBottom: 6,
                  background: isDark ? `${C.card}` : "#f0fdf4",
                  border: `1px solid ${isDark ? C.cardBorder : "#d1e7dd"}`,
                  opacity: itemOp,
                }}>
                  <span style={{ fontSize: 13, color: C.muted, fontFamily: cairo }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: cairo }}>{item.val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Live Tracking ──
const Scene_Tracking: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const truckX = interpolate(frame, [40, 190], [80, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const truckBounce = Math.sin(frame * 0.3) * 3;
  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const mapDots = [
    { x: 200, y: 200, label: "نقطة التحميل" },
    { x: 400, y: 280, label: "نقطة فحص" },
    { x: 600, y: 220, label: "محطة الوزن" },
    { x: 750, y: 350, label: "نقطة التسليم" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <BiTitle ar="تتبع مباشر لكل شحنة" en="Real-Time Shipment Tracking" C={C} frame={frame} fps={fps} size={50} />
      </div>

      {/* Map area */}
      <div style={{
        position: "absolute", top: 200, left: 100, right: 100, height: 450,
        borderRadius: 24, background: isDark ? `linear-gradient(135deg, ${C.card}, ${C.bg2})` : "#f9fafb",
        border: `2px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        overflow: "hidden",
      }}>
        {/* Grid */}
        {Array.from({ length: 12 }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", top: i * 38, left: 0, right: 0, height: 1, background: C.primary, opacity: 0.06 }} />
            <div style={{ position: "absolute", left: i * 70, top: 0, bottom: 0, width: 1, background: C.primary, opacity: 0.04 }} />
          </React.Fragment>
        ))}

        {/* Route line */}
        <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1720 450">
          <path d={`M ${mapDots.map(d => `${d.x},${d.y}`).join(" L ")}`}
            stroke={C.primary} strokeWidth="3" fill="none" strokeDasharray="8,6"
            opacity={interpolate(frame, [30, 60], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </svg>

        {/* Dots */}
        {mapDots.map((dot, i) => {
          const dotOp = interpolate(frame, [30 + i * 20, 50 + i * 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const pingScale = interpolate(Math.sin(frame * 0.06 + i * 2), [-1, 1], [1, 1.8]);
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: dot.x - 14, top: dot.y - 14, width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.primary}`, transform: `scale(${pingScale})`, opacity: dotOp * 0.3 }} />
              <div style={{ position: "absolute", left: dot.x - 8, top: dot.y - 8, width: 16, height: 16, borderRadius: "50%", background: i === 3 ? C.gold : C.primary, opacity: dotOp, boxShadow: `0 0 12px ${C.primary}` }} />
              <div style={{ position: "absolute", left: dot.x - 40, top: dot.y + 20, width: 80, textAlign: "center", fontSize: 14, fontWeight: 700, color: C.muted, fontFamily: cairo, opacity: dotOp }}>{dot.label}</div>
            </React.Fragment>
          );
        })}

        {/* Truck */}
        <div style={{ position: "absolute", left: truckX, top: 240 + truckBounce, fontSize: 44, transform: "scaleX(-1)" }}>🚛</div>
      </div>

      {/* Bottom stats */}
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          { icon: "📍", label: "تتبع GPS حي", val: "Live GPS" },
          { icon: "🔔", label: "إشعارات فورية", val: "Instant Alerts" },
          { icon: "📸", label: "توثيق بالصور", val: "Photo Proof" },
          { icon: "⏱️", label: "وقت الوصول", val: "ETA Tracking" },
        ].map((item, i) => {
          const op = interpolate(frame, [100 + i * 15, 120 + i * 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              padding: "14px 24px", borderRadius: 16,
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              textAlign: "center", opacity: op,
              boxShadow: isDark ? "none" : "0 4px 15px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo }}>{item.label}</div>
              <div style={{ fontSize: 13, color: C.muted, fontFamily: inter }}>{item.val}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Auto Invoicing ──
const Scene_Invoicing: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <BiTitle ar="فوترة إلكترونية تلقائية" en="Automated E-Invoicing" C={C} frame={frame} fps={fps} size={50} />
      </div>

      {/* Invoice mockup */}
      <div style={{
        position: "absolute", left: 200, top: 200,
        width: 600, minHeight: 500, borderRadius: 20,
        background: isDark ? C.card : "#fff",
        border: `2px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        padding: 40, direction: "rtl",
        boxShadow: isDark ? `0 0 30px ${C.primary}10` : "0 10px 40px rgba(0,0,0,0.08)",
        opacity: interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `scale(${spring({ frame: frame - 10, fps, config: { damping: 15 } })})`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.primary, fontFamily: cairo }}>فاتورة ضريبية</div>
            <div style={{ fontSize: 14, color: C.muted, fontFamily: inter }}>TAX INVOICE #INV-2024-0847</div>
          </div>
          <div style={{ fontSize: 40 }}>♻️</div>
        </div>

        <div style={{ height: 2, background: `linear-gradient(90deg, ${C.primary}, transparent)`, marginBottom: 20 }} />

        {[
          { label: "المولّد", val: "شركة التوحيد للخدمات البيئية" },
          { label: "الناقل", val: "أسطول النيل للنقل" },
          { label: "رقم الشحنة", val: "SHP-2024-0847" },
          { label: "نوع المخلفات", val: "مخلفات صناعية غير خطرة" },
          { label: "الوزن الفعلي", val: "2,500 كجم" },
          { label: "السعر/طن", val: "850 ج.م" },
        ].map((row, i) => {
          const rowOp = interpolate(frame, [40 + i * 10, 55 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: `1px solid ${isDark ? C.cardBorder : "#f0f0f0"}`,
              opacity: rowOp,
            }}>
              <span style={{ fontSize: 16, color: C.muted, fontFamily: cairo }}>{row.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo }}>{row.val}</span>
            </div>
          );
        })}

        <div style={{
          marginTop: 20, padding: "14px 20px", borderRadius: 12,
          background: `${C.primary}15`, border: `1px solid ${C.primary}40`,
          display: "flex", justifyContent: "space-between",
          opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.primary, fontFamily: cairo }}>الإجمالي</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.primary, fontFamily: inter }}>2,125 EGP</span>
        </div>
      </div>

      {/* Right side features */}
      <div style={{ position: "absolute", right: 120, top: 220, display: "flex", flexDirection: "column", gap: 20 }}>
        {[
          { icon: "⚡", ar: "إصدار تلقائي", en: "Auto-generated", desc: "تُصدر الفاتورة فور اكتمال الشحنة" },
          { icon: "🔒", ar: "متوافقة ضريبياً", en: "Tax Compliant", desc: "متوافقة مع منظومة الفاتورة الإلكترونية" },
          { icon: "📧", ar: "إرسال فوري", en: "Instant Delivery", desc: "تُرسل عبر البريد والواتساب تلقائياً" },
          { icon: "📋", ar: "شهادة تخلص", en: "Disposal Certificate", desc: "شهادة تخلص آمن مرفقة مع كل فاتورة" },
        ].map((item, i) => {
          const s = spring({ frame: frame - 50 - i * 18, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: "flex", gap: 16, alignItems: "center",
              padding: "16px 20px", borderRadius: 16, width: 420,
              background: isDark ? C.card : "#f9fafb",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              opacity: s, transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
            }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo }}>{item.ar}</div>
                <div style={{ fontSize: 13, color: C.primary, fontFamily: inter }}>{item.en}</div>
                <div style={{ fontSize: 14, color: C.muted, fontFamily: cairo, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: Smart Notifications ──
const Scene_Notifications: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const notifications = [
    { icon: "📦", title: "شحنة جديدة #0847", body: "تم إنشاء شحنة جديدة من شركة التوحيد البيئية", time: "الآن", color: C.primary },
    { icon: "🚛", title: "بدء النقل", body: "السائق أحمد محمد بدأ نقل الشحنة SHP-0847", time: "منذ 5 دقائق", color: C.accent },
    { icon: "⚖️", title: "تسجيل الوزن", body: "تم تسجيل الوزن الفعلي: 2,500 كجم بمحطة الوزن", time: "منذ 15 دقيقة", color: C.gold },
    { icon: "✅", title: "تسليم مكتمل", body: "تم تسليم الشحنة بنجاح وتوثيق التسليم بالصور", time: "منذ 30 دقيقة", color: "#22c55e" },
    { icon: "📄", title: "فاتورة جاهزة", body: "تم إصدار الفاتورة الإلكترونية #INV-0847 تلقائياً", time: "منذ 32 دقيقة", color: "#a78bfa" },
    { icon: "📊", title: "تقرير يومي", body: "تقرير الأداء اليومي جاهز — 47 شحنة مكتملة", time: "منذ ساعة", color: "#f472b6" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center" }}>
        <BiTitle ar="إشعارات ذكية لكل خطوة" en="Smart Notifications at Every Step" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 800, display: "flex", flexDirection: "column", gap: 14, direction: "rtl" }}>
          {notifications.map((n, i) => {
            const delay = 20 + i * 22;
            const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
            const slideX = interpolate(s, [0, 1], [100, 0]);

            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 18,
                padding: "18px 24px", borderRadius: 18,
                background: isDark ? C.card : "#fff",
                border: `1px solid ${n.color}30`,
                opacity: s, transform: `translateX(${slideX}px)`,
                boxShadow: isDark ? `0 0 15px ${n.color}08` : `0 4px 15px ${n.color}10`,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${n.color}15`, border: `1px solid ${n.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, flexShrink: 0,
                }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.white, fontFamily: cairo }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: C.muted, fontFamily: cairo }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 15, color: C.muted, fontFamily: cairo, marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ep2Dark: React.FC = () => <Episode C={D} />;
export const Ep2Light: React.FC = () => <Episode C={L} />;
