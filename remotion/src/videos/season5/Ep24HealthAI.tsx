import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S5Background, S5Header, S5Outro, S5Feature, S5Stat, cairo, inter, mono, C5, t5 } from "./S5Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t5(dark);
  const tools = [
    { icon: "💡", name: "البصمة الضوئية", en: "PPG Scan", color: C5.electric },
    { icon: "👤", name: "مسح الوجه", en: "rPPG Face Scan", color: C5.violet },
    { icon: "🎤", name: "تحليل الصوت", en: "Voice Stress", color: C5.magenta },
    { icon: "🤖", name: "المدرب الصحي", en: "AI Health Coach", color: C5.emerald },
    { icon: "👁️", name: "حارس العين", en: "Eye Guardian", color: C5.cyan },
    { icon: "📊", name: "السجل الصحي", en: "Health Records", color: C5.amber },
    { icon: "🫁", name: "تمارين التنفس", en: "Breathwork", color: C5.electric },
    { icon: "👂", name: "فحص السمع", en: "Audiometry", color: C5.violet },
    { icon: "👥", name: "صحة الفريق", en: "Team Health", color: C5.magenta },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="iRecycle Health" titleEn="9 AI Health Tools" subtitle="منظومة صحية ذكية شاملة لقطاع النفايات" episodeNum={24} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 40 }}>
        {tools.map((t, i) => {
          const s = spring({ frame: frame - 55 - i * 10, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              padding: "18px 16px", borderRadius: 14, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
            }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: t.color }}>{t.en}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="قياسات بدون أجهزة" titleEn="No-Device Health Monitoring" episodeNum={24} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="📱" titleAr="كاميرا الهاتف فقط" titleEn="Phone Camera Only" desc="قياس التوتر والطاقة والمؤشرات الحيوية بكاميرا الهاتف دون أي أجهزة إضافية" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="🔒" titleAr="خصوصية كاملة" titleEn="Full Privacy (RLS)" desc="كل البيانات الصحية محمية بسياسات أمان صارمة — لا يراها إلا صاحبها" color={C5.violet} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📈" titleAr="مقارنات يومية" titleEn="Daily Comparisons" desc="تتبع تطور صحتك يومياً مع رسوم بيانية تفاعلية ومقارنات أسبوعية" color={C5.emerald} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="🌐" titleAr="مفتوح للجميع" titleEn="Free Public Access" desc="أي زائر يقدر يفحص نفسه مجاناً بدون تسجيل دخول" color={C5.cyan} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="تأثير iRecycle Health" titleEn="Health Impact" episodeNum={24} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏥" value="9" label="أداة صحية" labelEn="Health Tools" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="👤" value="0" label="أجهزة مطلوبة" labelEn="Devices Needed" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔒" value="100%" label="خصوصية" labelEn="Privacy Protected" color={C5.emerald} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💚" value="24/7" label="متاح دائماً" labelEn="Always Available" color={C5.magenta} />
      </div>
    </AbsoluteFill>
  );
};

const EpisodeVideo = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S5Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={560}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={540}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={520}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={24} nextTitle="AI Chatbot" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep24Dark = () => <EpisodeVideo dark={true} />;
export const Ep24Light = () => <EpisodeVideo dark={false} />;
