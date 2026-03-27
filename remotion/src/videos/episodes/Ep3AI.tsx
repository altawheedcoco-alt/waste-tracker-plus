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
  const bgHue = interpolate(frame, [0, 1350], [260, 200]);
  const bgAngle = interpolate(frame, [0, 1350], [135, 165]);

  return (
    <AbsoluteFill style={{
      background: isDark
        ? `linear-gradient(${bgAngle}deg, #050810 0%, hsl(${bgHue}, 40%, 6%) 40%, #050810 100%)`
        : `linear-gradient(${bgAngle}deg, #f5f0ff 0%, hsl(${bgHue}, 30%, 96%) 50%, #f0f5fa 100%)`,
      fontFamily: cairo,
    }}>
      <GridOverlay frame={frame} C={C} />
      <Particles frame={frame} C={C} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={200}>
          <LogoIntro C={C} episodeNum={3} titleAr="الذكاء الاصطناعي في المنصة" titleEn="AI-Powered Platform" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_AIOverview C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_AIFeatures C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_AIAgent C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene_AIDocuments C={C} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <LogoOutro C={C} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ── Scene: AI Overview ──
const Scene_AIOverview: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Neural network animation
  const nodes = [
    { x: 960, y: 350 }, // center
    { x: 600, y: 250 }, { x: 600, y: 450 },
    { x: 1320, y: 250 }, { x: 1320, y: 450 },
    { x: 400, y: 350 }, { x: 1520, y: 350 },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="ذكاء اصطناعي يدير عملياتك" en="AI That Manages Your Operations" C={C} frame={frame} fps={fps} size={52} />
      </div>

      {/* Neural connections */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
        {nodes.slice(1).map((node, i) => {
          const lineOp = interpolate(frame, [30 + i * 10, 50 + i * 10], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <line key={i} x1={nodes[0].x} y1={nodes[0].y} x2={node.x} y2={node.y}
              stroke={C.primary} strokeWidth="2" opacity={lineOp}
              strokeDasharray="6,4" />
          );
        })}
      </svg>

      {/* Center brain */}
      <div style={{
        position: "absolute", left: 960 - 70, top: 350 - 70,
        width: 140, height: 140, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.primary}, #8b5cf6)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 64,
        boxShadow: `0 0 ${interpolate(Math.sin(frame * 0.06), [-1, 1], [15, 45])}px ${C.primary}60`,
        transform: `scale(${spring({ frame: frame - 10, fps, config: { damping: 12 } })})`,
      }}>🧠</div>

      {/* Feature nodes */}
      {[
        { x: 600, y: 250, icon: "🔍", ar: "تصنيف المخلفات", en: "Waste Classification" },
        { x: 600, y: 450, icon: "📊", ar: "تحليل البيانات", en: "Data Analytics" },
        { x: 1320, y: 250, icon: "📄", ar: "توليد المستندات", en: "Doc Generation" },
        { x: 1320, y: 450, icon: "💬", ar: "وكيل ذكي", en: "AI Agent" },
        { x: 400, y: 350, icon: "🔮", ar: "التنبؤ والتخطيط", en: "Forecasting" },
        { x: 1520, y: 350, icon: "🎯", ar: "تحسين المسارات", en: "Route Optimization" },
      ].map((node, i) => {
        const s = spring({ frame: frame - 25 - i * 12, fps, config: { damping: 14 } });
        const pulse = interpolate(Math.sin(frame * 0.04 + i * 1.5), [-1, 1], [0.95, 1.05]);
        return (
          <div key={i} style={{
            position: "absolute", left: node.x - 90, top: node.y - 45,
            width: 180, textAlign: "center",
            transform: `scale(${s * pulse})`, opacity: s,
          }}>
            <div style={{
              width: 70, height: 70, borderRadius: 20, margin: "0 auto 10px",
              background: isDark ? C.card : "#fff",
              border: `2px solid ${C.primary}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, boxShadow: isDark ? `0 0 15px ${C.primary}15` : "0 4px 15px rgba(0,0,0,0.08)",
            }}>{node.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: cairo }}>{node.ar}</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: inter }}>{node.en}</div>
          </div>
        );
      })}

      {/* Bottom tagline */}
      <div style={{
        position: "absolute", bottom: 70, width: "100%", textAlign: "center",
        opacity: interpolate(frame, [130, 155], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{ fontSize: 24, color: C.primary, fontFamily: cairo, fontWeight: 700 }}>
          أكثر من 15 خاصية ذكاء اصطناعي مدمجة في المنصة
        </div>
        <div style={{ fontSize: 16, color: C.muted, fontFamily: inter, marginTop: 4 }}>
          15+ Built-in AI Features Across the Platform
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: AI Features Grid ──
const Scene_AIFeatures: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const features = [
    { icon: "📸", ar: "تحليل الصور بالذكاء الاصطناعي", en: "AI Image Analysis", desc: "تصنيف تلقائي للمخلفات من صورة واحدة مع تقييم الجودة", color: "#8b5cf6" },
    { icon: "📝", ar: "توليد التقارير الذكية", en: "Smart Report Generation", desc: "تقارير PDF احترافية بضغطة زر مع تحليل الأداء والتوصيات", color: C.primary },
    { icon: "🔮", ar: "التنبؤ بالطلب", en: "Demand Forecasting", desc: "نماذج تنبؤية لحجم المخلفات المتوقع والتخطيط المسبق", color: C.accent },
    { icon: "🎯", ar: "تحسين المسارات", en: "Route Optimization", desc: "خوارزميات ذكية لاختيار أفضل المسارات وتقليل التكلفة", color: C.gold },
    { icon: "⚠️", ar: "كشف الشذوذ", en: "Anomaly Detection", desc: "رصد تلقائي للبيانات غير الطبيعية والتنبيه الفوري", color: "#ef4444" },
    { icon: "💡", ar: "توصيات ذكية", en: "Smart Recommendations", desc: "اقتراحات مخصصة لتحسين الكفاءة وتقليل الهدر", color: "#22c55e" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp, padding: "0 80px" }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", left: 0 }}>
        <BiTitle ar="قدرات ذكاء اصطناعي متقدمة" en="Advanced AI Capabilities" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 190, left: 80, right: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, direction: "rtl" }}>
        {features.map((f, i) => {
          const delay = 15 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
          const x = interpolate(s, [0, 1], [i % 2 === 0 ? -80 : 80, 0]);
          const pulse = Math.sin((frame + i * 30) * 0.04) * 2;

          return (
            <div key={i} style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
              borderRadius: 22, padding: "26px 28px",
              border: `1px solid ${f.color}${isDark ? "22" : "18"}`,
              boxShadow: isDark ? "none" : `0 4px 20px ${f.color}08`,
              transform: `translateX(${x}px) translateY(${pulse}px)`,
              opacity: s, display: "flex", alignItems: "flex-start", gap: 20,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${f.color}${isDark ? "12" : "08"} 0%, transparent 70%)` }} />
              <div style={{
                width: 68, height: 68, borderRadius: 18,
                background: `${f.color}${isDark ? "18" : "10"}`,
                border: `1px solid ${f.color}${isDark ? "30" : "20"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, flexShrink: 0,
              }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.white, fontFamily: cairo, marginBottom: 4 }}>{f.ar}</div>
                <div style={{ fontSize: 14, color: f.color, fontFamily: inter, marginBottom: 6 }}>{f.en}</div>
                <div style={{ fontSize: 16, color: C.muted, fontFamily: cairo, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: AI Agent ──
const Scene_AIAgent: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const messages = [
    { role: "user", text: "عايز أعرف كم شحنة تمت النهاردة؟", delay: 20 },
    { role: "ai", text: "تم إكمال 47 شحنة اليوم بإجمالي وزن 125.6 طن. معدل الأداء أعلى من المتوسط بنسبة 12%.", delay: 55 },
    { role: "user", text: "طيب اعملي تقرير أسبوعي PDF", delay: 90 },
    { role: "ai", text: "تم إنشاء التقرير الأسبوعي بنجاح! 📊\nيتضمن: 312 شحنة، 847 طن، إيرادات 425,000 ج.م\nالتقرير جاهز للتحميل أو الإرسال عبر البريد.", delay: 120 },
    { role: "user", text: "ابعته للمدير على الواتساب", delay: 160 },
    { role: "ai", text: "تم إرسال التقرير للمدير أحمد محمد على واتساب بنجاح ✅", delay: 180 },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="وكيل ذكي يفهم أعمالك" en="AI Agent That Understands Your Business" C={C} frame={frame} fps={fps} size={48} />
      </div>

      {/* Chat window */}
      <div style={{
        position: "absolute", top: 180, left: "50%", transform: "translateX(-50%)",
        width: 850, borderRadius: 24,
        background: isDark ? C.card : "#fff",
        border: `2px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        overflow: "hidden",
        boxShadow: isDark ? `0 0 30px ${C.primary}10` : "0 10px 40px rgba(0,0,0,0.08)",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
          background: isDark ? C.bg2 : "#f9fafb",
          borderBottom: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: cairo }}>مساعد iRecycle الذكي</div>
            <div style={{ fontSize: 12, color: "#22c55e", fontFamily: inter }}>● متصل الآن</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: "20px 24px", direction: "rtl", display: "flex", flexDirection: "column", gap: 14, minHeight: 450 }}>
          {messages.map((msg, i) => {
            const msgOp = interpolate(frame, [msg.delay, msg.delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const isAI = msg.role === "ai";
            return (
              <div key={i} style={{
                display: "flex", justifyContent: isAI ? "flex-start" : "flex-end",
                opacity: msgOp, transform: `translateY(${interpolate(msgOp, [0, 1], [15, 0])}px)`,
              }}>
                <div style={{
                  maxWidth: "70%", padding: "14px 18px", borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                  background: isAI ? (isDark ? C.bg2 : "#f0fdf4") : `${C.primary}`,
                  border: isAI ? `1px solid ${isDark ? C.cardBorder : "#d1e7dd"}` : "none",
                  fontSize: 16, lineHeight: 1.6, fontFamily: cairo,
                  color: isAI ? C.white : "#fff",
                  whiteSpace: "pre-wrap",
                }}>{msg.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene: AI Documents ──
const Scene_AIDocuments: React.FC<{ C: Theme }> = ({ C }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isDark = C.bg1 === D.bg1;

  const exitOp = interpolate(frame, [190, 220], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const docs = [
    { icon: "📋", title: "عقود إلكترونية", en: "Smart Contracts", desc: "توليد عقود مخصصة بالذكاء الاصطناعي مع بنود قانونية دقيقة" },
    { icon: "📊", title: "تقارير بيئية", en: "Environmental Reports", desc: "تقارير امتثال بيئي شاملة مع رسوم بيانية وتحليلات" },
    { icon: "📑", title: "عروض أسعار ذكية", en: "Smart Quotations", desc: "حساب تلقائي للأسعار بناءً على النوع والكمية والمسافة" },
    { icon: "🏆", title: "شهادات الإنجاز", en: "Achievement Certificates", desc: "شهادات رقمية للجهات المتميزة في إعادة التدوير" },
  ];

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <BiTitle ar="مستندات ذكية بالذكاء الاصطناعي" en="AI-Powered Smart Documents" C={C} frame={frame} fps={fps} size={48} />
      </div>

      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30, direction: "rtl" }}>
        {docs.map((doc, i) => {
          const s = spring({ frame: frame - 20 - i * 18, fps, config: { damping: 12 } });
          const y = interpolate(s, [0, 1], [60, 0]);
          const hover = interpolate(Math.sin(frame * 0.03 + i * 1.5), [-1, 1], [-3, 3]);

          return (
            <div key={i} style={{
              width: 360, padding: "36px 28px", borderRadius: 24, textAlign: "center",
              background: isDark ? C.card : "#fff",
              border: `1px solid ${isDark ? C.cardBorder : "#e5e7eb"}`,
              opacity: s, transform: `translateY(${y + hover}px)`,
              boxShadow: isDark ? `0 0 25px ${C.primary}10` : "0 8px 30px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                width: 90, height: 90, borderRadius: 24, margin: "0 auto 20px",
                background: `${C.primary}12`, border: `2px solid ${C.primary}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 46,
              }}>{doc.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.white, fontFamily: cairo, marginBottom: 6 }}>{doc.title}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.primary, fontFamily: inter, marginBottom: 10 }}>{doc.en}</div>
              <div style={{ fontSize: 16, color: C.muted, fontFamily: cairo, lineHeight: 1.6 }}>{doc.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40,
        opacity: interpolate(frame, [140, 165], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        {[
          { val: "10,000+", label: "مستند تم توليده" },
          { val: "98%", label: "دقة التصنيف" },
          { val: "< 5 ثوانٍ", label: "وقت التوليد" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.primary, fontFamily: inter }}>{stat.val}</div>
            <div style={{ fontSize: 16, color: C.muted, fontFamily: cairo }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Ep3Dark: React.FC = () => <Episode C={D} />;
export const Ep3Light: React.FC = () => <Episode C={L} />;
