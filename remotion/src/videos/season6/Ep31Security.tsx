import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S6Background, S6Header, S6Outro, S6Feature, S6Stat, cairo, inter, mono, C6, t6 } from "./S6Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="الأمان والصلاحيات" titleEn="Security & Access Control" subtitle="حماية بياناتك بأعلى معايير الأمان السيبراني" episodeNum={31} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="🔐" titleAr="مصادقة متعددة" titleEn="Multi-Factor Auth" desc="تسجيل دخول آمن بالبريد، الهاتف، البصمة، والمصادقة الثنائية" color={C6.red} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="👥" titleAr="أدوار وصلاحيات" titleEn="Role-Based Access" desc="نظام صلاحيات دقيق حسب الدور — مدير، مشرف، محاسب، سائق" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="🛡️" titleAr="حماية البيانات" titleEn="Data Protection (RLS)" desc="سياسات أمان على مستوى الصف تمنع الوصول غير المصرح" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📋" titleAr="سجل التدقيق" titleEn="Audit Trail" desc="تسجيل كامل لكل عملية — من فعلها، متى، وماذا تغير" color={C6.indigo} />
        </div>
        {/* Shield visualization */}
        <div style={{ width: 360, height: 360, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20, stiffness: 120 } });
            const pulse = 1 + Math.sin(frame * 0.04) * 0.03;
            const r = frame * 0.3;
            return (
              <div style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`, position: "relative" }}>
                {[200, 260, 320].map((size, i) => (
                  <div key={i} style={{
                    position: "absolute", left: "50%", top: "50%",
                    width: size, height: size, borderRadius: "50%",
                    border: `1px solid ${[C6.red, C6.orange, C6.teal][i]}15`,
                    transform: `translate(-50%, -50%) rotate(${r * (i % 2 === 0 ? 1 : -1)}deg)`,
                  }}>
                    <div style={{
                      position: "absolute", top: -4, left: "50%", width: 8, height: 8, borderRadius: "50%",
                      background: [C6.red, C6.orange, C6.teal][i], transform: "translateX(-50%)", opacity: 0.6,
                    }} />
                  </div>
                ))}
                <div style={{ fontSize: 72, transform: `scale(${pulse})`, position: "relative", zIndex: 1 }}>🛡️</div>
              </div>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t6(dark);
  const layers = [
    { icon: "🌐", name: "طبقة الشبكة", en: "Network Layer", color: C6.orange },
    { icon: "🔑", name: "طبقة المصادقة", en: "Auth Layer", color: C6.red },
    { icon: "📊", name: "طبقة البيانات", en: "Data Layer (RLS)", color: C6.teal },
    { icon: "👁️", name: "طبقة المراقبة", en: "Monitoring Layer", color: C6.amber },
    { icon: "🔄", name: "طبقة النسخ الاحتياطي", en: "Backup Layer", color: C6.indigo },
    { icon: "📜", name: "طبقة التدقيق", en: "Audit Layer", color: C6.steel },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="طبقات الحماية" titleEn="Security Layers" episodeNum={31} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {layers.map((l, i) => {
          const s = spring({ frame: frame - 55 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${l.color}20`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{l.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{l.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: l.color }}>{l.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الأمان" titleEn="Security Metrics" episodeNum={31} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🔐" value="256-bit" label="تشفير البيانات" labelEn="Data Encryption" color={C6.red} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🛡️" value="99.9%" label="وقت التشغيل" labelEn="Uptime SLA" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="👥" value="15+" label="مستوى صلاحية" labelEn="Permission Levels" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📋" value="100%" label="تدقيق كامل" labelEn="Full Audit Trail" color={C6.indigo} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S6Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={560}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={31} nextTitle="Mobile Operations" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep31Dark = () => <EpisodeVideo dark={true} />;
export const Ep31Light = () => <EpisodeVideo dark={false} />;
