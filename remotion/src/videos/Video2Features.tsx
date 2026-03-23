import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const features = [
  { icon: "🤖", ar: "ذكاء اصطناعي متقدم", en: "Advanced AI Engine", desc: "تصنيف تلقائي للمخلفات، تحليل الصور، توليد التقارير والمستندات", color: "#8b5cf6" },
  { icon: "📍", ar: "تتبع GPS حي", en: "Live GPS Tracking", desc: "تتبع المركبات والشحنات لحظياً على الخريطة مع تنبيهات ذكية", color: "#3b82f6" },
  { icon: "📄", ar: "فوترة إلكترونية", en: "E-Invoicing System", desc: "فواتير تلقائية متوافقة مع الضرائب وشهادات التخلص الآمن", color: "#f59e0b" },
  { icon: "📊", ar: "تحليلات وتقارير", en: "Analytics & Reports", desc: "لوحات تحكم تفاعلية وتقارير PDF احترافية بضغطة زر", color: "#22996E" },
  { icon: "🎓", ar: "أكاديمية تدريبية", en: "Training Academy", desc: "دورات معتمدة في إدارة المخلفات مع شهادات رقمية", color: "#ec4899" },
  { icon: "📱", ar: "تطبيق ذكي PWA", en: "Smart PWA App", desc: "يعمل على أي جهاز بدون تحميل — موبايل وديسكتوب", color: "#06b6d4" },
];

const FeatureCard = ({ f, index, frame, fps, dark }: { f: typeof features[0]; index: number; frame: number; fps: number; dark: boolean }) => {
  const delay = 10 + index * 18;
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const x = interpolate(s, [0, 1], [index % 2 === 0 ? -120 : 120, 0]);
  const pulse = Math.sin((frame + index * 30) * 0.04) * 2;

  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.04)" : "#ffffff",
      borderRadius: 20,
      padding: "28px 32px",
      border: `1px solid ${f.color}${dark ? "22" : "18"}`,
      boxShadow: dark ? "none" : `0 4px 20px ${f.color}08`,
      transform: `translateX(${x}px) translateY(${pulse}px)`,
      opacity: s,
      display: "flex",
      alignItems: "flex-start",
      gap: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle, ${f.color}${dark ? "12" : "08"} 0%, transparent 70%)`,
      }} />
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: `${f.color}${dark ? "18" : "10"}`,
        border: `1px solid ${f.color}${dark ? "30" : "20"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34, flexShrink: 0,
      }}>{f.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: cairo, fontSize: 24, fontWeight: 700, color: dark ? "#fff" : "#1a1a2e", marginBottom: 4 }}>{f.ar}</div>
        <div style={{ fontFamily: inter, fontSize: 14, color: f.color, marginBottom: 6 }}>{f.en}</div>
        <div style={{ fontFamily: cairo, fontSize: 16, color: dark ? "rgba(255,255,255,0.5)" : "#777", lineHeight: 1.5 }}>{f.desc}</div>
      </div>
    </div>
  );
};

const TitleSection = ({ frame, fps, dark }: { frame: number; fps: number; dark: boolean }) => {
  const s = spring({ frame: frame - 3, fps, config: { damping: 15 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  return (
    <div style={{ opacity: s, transform: `translateY(${y}px)`, marginBottom: 40 }}>
      <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: "#22996E", direction: "rtl", letterSpacing: "0.1em", marginBottom: 8 }}>المميزات التقنية</div>
      <div style={{ fontFamily: cairo, fontSize: 46, fontWeight: 900, color: dark ? "#fff" : "#1a1a2e", direction: "rtl", lineHeight: 1.3 }}>
        كل ما تحتاجه في <span style={{ color: "#22996E" }}>منصة واحدة</span>
      </div>
    </div>
  );
};

const FeaturesPage = ({ features: feats, frame, fps, dark }: { features: typeof features; frame: number; fps: number; dark: boolean }) => (
  <AbsoluteFill style={{ padding: "70px 100px", direction: "rtl" }}>
    <TitleSection frame={frame} fps={fps} dark={dark} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {feats.map((f, i) => <FeatureCard key={i} f={f} index={i} frame={frame} fps={fps} dark={dark} />)}
    </div>
  </AbsoluteFill>
);

const FloatingParticles = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const x = (i * 191 + 80) % 1920;
    const y = (i * 143 + 60) % 1080 + Math.sin((frame + i * 25) * 0.02) * 30;
    const size = 3 + (i % 3) * 2;
    const op = interpolate(Math.sin((frame + i * 40) * 0.015), [-1, 1], [0.03, 0.12]);
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: i % 2 === 0 ? "#22996E" : (dark ? "#fff" : "#d4d4d8"), opacity: op }} />;
  });
  return <AbsoluteFill>{particles}</AbsoluteFill>;
};

export const Video2Dark = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgShift = interpolate(frame, [0, 1350], [0, 40]);
  const exitOp = interpolate(frame, [1280, 1350], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${135 + bgShift}deg, #0a1a14 0%, hsl(160,40%,8%) 50%, #0d0d1e 100%)` }}>
      <FloatingParticles frame={frame} dark />
      <AbsoluteFill style={{ opacity: exitOp }}>
        <FeaturesPage features={features} frame={frame} fps={fps} dark />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Video2Light = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgShift = interpolate(frame, [0, 1350], [0, 40]);
  const exitOp = interpolate(frame, [1280, 1350], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${135 + bgShift}deg, #f0faf5 0%, hsl(155,30%,96%) 50%, #f5f7fa 100%)` }}>
      <FloatingParticles frame={frame} dark={false} />
      <AbsoluteFill style={{ opacity: exitOp }}>
        <FeaturesPage features={features} frame={frame} fps={fps} dark={false} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
