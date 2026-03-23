import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairo } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: inter } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const orgs = [
  { icon: "🏭", ar: "جهة مولّدة", en: "Waste Generator", desc: "مصانع، مستشفيات، فنادق — تسجّل مخلفاتها وتطلب نقلها", color: "#ef4444", features: ["تسجيل المخلفات", "طلب شحنات", "شهادات التخلص"] },
  { icon: "🚛", ar: "جهة ناقلة", en: "Waste Hauler", desc: "شركات النقل المرخصة — تدير أسطولها وسائقيها", color: "#3b82f6", features: ["إدارة الأسطول", "تتبع GPS", "فوترة تلقائية"] },
  { icon: "♻️", ar: "جهة مدوّرة", en: "Recycler", desc: "مصانع التدوير — تستقبل وتعالج وتُصدّر المواد المعاد تدويرها", color: "#22996E", features: ["استقبال الشحنات", "تقارير التدوير", "شهادات بيئية"] },
  { icon: "🚗", ar: "سائق مستقل", en: "Independent Driver", desc: "يقبل الشحنات مثل Didi — يكسب من كل رحلة", color: "#f59e0b", features: ["عروض فورية", "محفظة مالية", "تتبع حي"] },
  { icon: "👔", ar: "مستشار بيئي", en: "Environmental Consultant", desc: "خبراء معتمدون — يقدمون خدمات الاستشارات والتدقيق", color: "#8b5cf6", features: ["ملف تعريفي", "حجز استشارات", "شهادات أيزو"] },
];

const OrgCard = ({ org, index, frame, fps, dark }: { org: typeof orgs[0]; index: number; frame: number; fps: number; dark: boolean }) => {
  const delay = 15 + index * 22;
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const y = interpolate(s, [0, 1], [100, 0]);
  const isLeft = index % 2 === 0;

  return (
    <div style={{
      transform: `translateY(${y}px)`,
      opacity: s,
      display: "flex",
      alignItems: "center",
      gap: 32,
      flexDirection: isLeft ? "row" : "row-reverse",
    }}>
      {/* Icon circle */}
      <div style={{
        width: 110, height: 110, borderRadius: "50%", flexShrink: 0,
        background: `${org.color}${dark ? "15" : "08"}`,
        border: `2px solid ${org.color}${dark ? "40" : "25"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 50,
      }}>{org.icon}</div>

      {/* Content */}
      <div style={{ flex: 1, direction: "rtl" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          <span style={{ fontFamily: cairo, fontSize: 28, fontWeight: 900, color: dark ? "#fff" : "#1a1a2e" }}>{org.ar}</span>
          <span style={{ fontFamily: inter, fontSize: 16, color: org.color, fontWeight: 700 }}>{org.en}</span>
        </div>
        <div style={{ fontFamily: cairo, fontSize: 18, color: dark ? "rgba(255,255,255,0.5)" : "#777", marginBottom: 10, lineHeight: 1.5 }}>{org.desc}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {org.features.map((f, fi) => {
            const tagS = spring({ frame: frame - delay - 10 - fi * 8, fps, config: { damping: 18 } });
            return (
              <span key={fi} style={{
                fontFamily: cairo, fontSize: 13, fontWeight: 600,
                color: org.color,
                background: `${org.color}${dark ? "15" : "08"}`,
                padding: "4px 14px", borderRadius: 20,
                border: `1px solid ${org.color}${dark ? "25" : "15"}`,
                opacity: tagS, transform: `scale(${tagS})`,
              }}>{f}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Content = ({ frame, fps, dark }: { frame: number; fps: number; dark: boolean }) => {
  const titleS = spring({ frame: frame - 3, fps, config: { damping: 15 } });
  const titleY = interpolate(titleS, [0, 1], [40, 0]);
  const exitOp = interpolate(frame, [1280, 1350], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "60px 120px", opacity: exitOp }}>
      <div style={{ opacity: titleS, transform: `translateY(${titleY}px)`, marginBottom: 36 }}>
        <div style={{ fontFamily: cairo, fontSize: 20, fontWeight: 700, color: "#22996E", direction: "rtl", letterSpacing: "0.1em", marginBottom: 8 }}>أنواع الجهات</div>
        <div style={{ fontFamily: cairo, fontSize: 44, fontWeight: 900, color: dark ? "#fff" : "#1a1a2e", direction: "rtl", lineHeight: 1.3 }}>
          منظومة متكاملة تربط <span style={{ color: "#22996E" }}>الجميع</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {orgs.map((o, i) => <OrgCard key={i} org={o} index={i} frame={frame} fps={fps} dark={dark} />)}
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

export const Video3Dark = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgShift = interpolate(frame, [0, 1350], [0, 35]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${140 + bgShift}deg, #0a1a14 0%, hsl(165,35%,8%) 50%, #0d0d1e 100%)` }}>
      <Particles frame={frame} dark />
      <Content frame={frame} fps={fps} dark />
    </AbsoluteFill>
  );
};

export const Video3Light = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgShift = interpolate(frame, [0, 1350], [0, 35]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${140 + bgShift}deg, #f0faf5 0%, hsl(150,25%,96%) 50%, #f5f7fa 100%)` }}>
      <Particles frame={frame} dark={false} />
      <Content frame={frame} fps={fps} dark={false} />
    </AbsoluteFill>
  );
};
