import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const steps = [
  { icon: "🏭", ar: "المصنع يسجل المخلفات", en: "Factory registers waste", num: "1", color: "#ef4444" },
  { icon: "📋", ar: "إنشاء طلب شحنة", en: "Shipment request created", num: "2", color: "#f59e0b" },
  { icon: "🚛", ar: "الناقل يقبل ويتحرك", en: "Hauler accepts & moves", num: "3", color: "#3b82f6" },
  { icon: "📍", ar: "تتبع حي على الخريطة", en: "Live GPS tracking", num: "4", color: "#06b6d4" },
  { icon: "📦", ar: "التسليم والتوثيق", en: "Delivery & documentation", num: "5", color: "#8b5cf6" },
  { icon: "♻️", ar: "التدوير وإصدار الشهادة", en: "Recycling & certificate", num: "6", color: "#22996E" },
];

const StepScene = ({ step, frame, fps, dark }: { step: typeof steps[0]; frame: number; fps: number; dark: boolean }) => {
  const numS = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 60, mass: 2 } });
  const numScale = interpolate(numS, [0, 1], [0.2, 1]);
  const iconS = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const textS = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const textY = interpolate(textS, [0, 1], [50, 0]);
  const pulse = Math.sin(frame * 0.06) * 5;

  // Progress bar
  const progress = interpolate(frame, [50, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Large step number */}
      <div style={{
        position: "absolute", top: 80, left: 100,
        fontFamily: inter, fontSize: 200, fontWeight: 900,
        color: `${step.color}${dark ? "10" : "06"}`,
        transform: `scale(${numScale})`,
        lineHeight: 1,
      }}>{step.num}</div>

      {/* Circular glow */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${step.color}${dark ? "08" : "05"} 0%, transparent 60%)`,
      }} />

      {/* Icon */}
      <div style={{
        fontSize: 120, marginBottom: 32,
        transform: `scale(${iconS}) translateY(${pulse}px)`,
        opacity: iconS,
      }}>{step.icon}</div>

      {/* Text */}
      <div style={{
        textAlign: "center",
        transform: `translateY(${textY}px)`,
        opacity: textS,
      }}>
        <div style={{
          fontFamily: cairo, fontSize: 48, fontWeight: 900,
          color: dark ? "#fff" : "#1a1a2e",
          marginBottom: 12, direction: "rtl",
        }}>{step.ar}</div>
        <div style={{
          fontFamily: inter, fontSize: 24, color: step.color, fontWeight: 700,
        }}>{step.en}</div>
      </div>

      {/* Step indicator */}
      <div style={{
        position: "absolute", bottom: 80,
        display: "flex", gap: 16, alignItems: "center",
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            width: i === parseInt(step.num) - 1 ? 40 : 12,
            height: 12, borderRadius: 6,
            background: i === parseInt(step.num) - 1 ? step.color : (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"),
            transition: "width 0.3s",
          }} />
        ))}
      </div>

      {/* Progress bar at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
      }}>
        <div style={{
          width: `${progress * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${step.color}, ${step.color}88)`,
        }} />
      </div>
    </AbsoluteFill>
  );
};

const Particles = ({ frame, dark }: { frame: number; dark: boolean }) => {
  const ps = Array.from({ length: 8 }, (_, i) => {
    const x = (i * 241 + 60) % 1920;
    const y = (i * 157 + 80) % 1080 + Math.sin((frame + i * 35) * 0.018) * 35;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: "50%", background: dark ? "#22996E" : "#d4d4d8", opacity: 0.08 }} />;
  });
  return <AbsoluteFill>{ps}</AbsoluteFill>;
};

const STEP_DUR = 270; // 9 seconds per step at 30fps

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const bgShift = interpolate(frame, [0, 1800], [0, 50]);
  const bgBase = dark
    ? `linear-gradient(${130 + bgShift}deg, #0a1a14 0%, hsl(170,35%,7%) 50%, #0d0d1e 100%)`
    : `linear-gradient(${130 + bgShift}deg, #f0faf5 0%, hsl(155,25%,96%) 50%, #f5f7fa 100%)`;

  return (
    <AbsoluteFill style={{ background: bgBase }}>
      <Particles frame={frame} dark={dark} />
      {/* Title intro - first 90 frames */}
      <Sequence from={0} durationInFrames={90}>
        <TitleIntro dark={dark} />
      </Sequence>
      {/* Each step */}
      {steps.map((step, i) => (
        <Sequence key={i} from={90 + i * STEP_DUR} durationInFrames={STEP_DUR}>
          <StepScene step={step} frame={0} fps={30} dark={dark} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const TitleIntro = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const y = interpolate(s, [0, 1], [60, 0]);
  const exitOp = interpolate(frame, [65, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exitOp }}>
      <div style={{ textAlign: "center", transform: `translateY(${y}px)`, opacity: s }}>
        <div style={{ fontFamily: cairo, fontSize: 22, fontWeight: 700, color: "#22996E", letterSpacing: "0.1em", marginBottom: 16 }}>رحلة الشحنة</div>
        <div style={{ fontFamily: cairo, fontSize: 56, fontWeight: 900, color: dark ? "#fff" : "#1a1a2e", direction: "rtl", lineHeight: 1.4 }}>
          من <span style={{ color: "#ef4444" }}>المصنع</span> إلى <span style={{ color: "#22996E" }}>التدوير</span>
        </div>
        <div style={{ fontFamily: cairo, fontSize: 28, color: dark ? "rgba(255,255,255,0.5)" : "#888", direction: "rtl", marginTop: 16 }}>6 خطوات... منصة واحدة</div>
      </div>
    </AbsoluteFill>
  );
};

export const Video4Dark = () => <VideoContent dark />;
export const Video4Light = () => <VideoContent dark={false} />;
