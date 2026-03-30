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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="العمليات الميدانية" titleEn="Mobile Field Operations" subtitle="إدارة كاملة من الهاتف — أينما كنت" episodeNum={32} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S6Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📱" titleAr="تطبيق متكامل" titleEn="Full Mobile App (PWA)" desc="تطبيق ويب تقدمي يعمل كتطبيق أصلي على أي جهاز" color={C6.orange} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={78} icon="📸" titleAr="توثيق بالكاميرا" titleEn="Camera Documentation" desc="التقاط صور الميزان والشحنات والتوقيعات مباشرة" color={C6.teal} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📍" titleAr="تحديد الموقع" titleEn="GPS Location" desc="تسجيل إحداثيات الجمع والتسليم تلقائياً" color={C6.amber} />
          <S6Feature frame={frame} fps={fps} dark={dark} delay={114} icon="📶" titleAr="العمل بدون إنترنت" titleEn="Offline Mode" desc="إتمام العمليات بدون اتصال ومزامنة تلقائية لاحقاً" color={C6.indigo} />
        </div>
        {/* Phone mockup */}
        <div style={{ width: 360, height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const s = spring({ frame: frame - 70, fps, config: { damping: 20 } });
            const th = t6(dark);
            return (
              <div style={{
                width: 200, height: 350, borderRadius: 30, padding: 12,
                background: th.card, border: `2px solid ${C6.orange}30`,
                opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.7, 1])}) rotateY(${interpolate(s, [0, 1], [15, 0])}deg)`,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ height: 6, width: 60, borderRadius: 3, background: `${th.muted}`, margin: "0 auto" }} />
                <div style={{ flex: 1, borderRadius: 18, background: dark ? "#111" : "#f5f5f5", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {["📦 شحنة #1042", "🚛 رحلة الصباح", "📋 فحص الجودة", "✅ تأكيد التسليم"].map((item, i) => {
                    const is = spring({ frame: frame - 90 - i * 12, fps, config: { damping: 18 } });
                    return (
                      <div key={i} style={{
                        padding: "8px 10px", borderRadius: 8,
                        background: `${C6.orange}${i === 0 ? "15" : "08"}`,
                        fontFamily: cairo, fontSize: 11, color: th.text,
                        opacity: is, transform: `translateX(${interpolate(is, [0, 1], [20, 0])}px)`,
                      }}>{item}</div>
                    );
                  })}
                </div>
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
  const tools = [
    { icon: "📸", name: "ماسح QR", en: "QR Scanner", color: C6.orange },
    { icon: "✍️", name: "توقيع رقمي", en: "Digital Signature", color: C6.teal },
    { icon: "⚖️", name: "إدخال الوزن", en: "Weight Entry", color: C6.amber },
    { icon: "📋", name: "قوائم الفحص", en: "Checklists", color: C6.indigo },
    { icon: "🗺️", name: "ملاحة ذكية", en: "Smart Navigation", color: C6.orange },
    { icon: "📞", name: "اتصال مباشر", en: "Direct Call", color: C6.red },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="أدوات السائق الميدانية" titleEn="Driver Field Tools" episodeNum={32} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 50 }}>
        {tools.map((t, i) => {
          const s = spring({ frame: frame - 55 - i * 14, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "28px 20px", borderRadius: 18, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{t.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: t.color }}>{t.en}</div>
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
      <S6Header frame={frame} fps={fps} dark={dark} titleAr="إنتاجية ميدانية" titleEn="Field Productivity" episodeNum={32} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S6Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📱" value="PWA" label="تطبيق فوري" labelEn="Instant App" color={C6.orange} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⏱️" value="50%" label="توفير وقت ميداني" labelEn="Field Time Saved" color={C6.teal} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📶" value="100%" label="عمل بدون نت" labelEn="Offline Capable" color={C6.amber} />
        <S6Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📸" value="1-Click" label="توثيق فوري" labelEn="Instant Capture" color={C6.indigo} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S6Outro frame={0} fps={30} dark={dark} episodeNum={32} nextTitle="Business Intelligence" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S6Background>
  );
};

export const Ep32Dark = () => <EpisodeVideo dark={true} />;
export const Ep32Light = () => <EpisodeVideo dark={false} />;
