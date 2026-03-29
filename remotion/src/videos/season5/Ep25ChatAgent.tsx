import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S5Background, S5Header, S5Outro, S5Feature, S5Stat, S5AIBrain, cairo, inter, mono, C5, t5 } from "./S5Common";

const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="وكيل الدردشة الذكي" titleEn="AI Chat Agent" subtitle="مساعد ذكي متعدد القنوات لخدمة العملاء" episodeNum={25} />
      <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <S5Feature frame={frame} fps={fps} dark={dark} delay={60} icon="💬" titleAr="واتساب وتليجرام" titleEn="WhatsApp & Telegram" desc="وكيل ذكي يرد على العملاء عبر واتساب وتليجرام والموقع تلقائياً" color={C5.electric} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={78} icon="🧠" titleAr="قاعدة معرفية" titleEn="Knowledge Base" desc="يتعلم من بيانات المنظمة ويجيب بدقة حسب السياسات والأسعار" color={C5.violet} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={96} icon="📦" titleAr="إنشاء طلبات" titleEn="Auto Order Creation" desc="يحول المحادثات لطلبات حقيقية ويربطها بنظام الشحنات تلقائياً" color={C5.emerald} />
          <S5Feature frame={frame} fps={fps} dark={dark} delay={114} icon="🚨" titleAr="تصعيد ذكي" titleEn="Smart Escalation" desc="يتعرف على الحالات الحرجة ويصعدها للموظف المختص فوراً" color={C5.magenta} />
        </div>
        <S5AIBrain frame={frame} fps={fps} dark={dark} delay={70} />
      </div>
    </AbsoluteFill>
  );
};

const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = t5(dark);
  const channels = [
    { icon: "📱", name: "واتساب", en: "WhatsApp", status: "متصل", color: "#25D366" },
    { icon: "✈️", name: "تليجرام", en: "Telegram", status: "متصل", color: "#229ED9" },
    { icon: "🌐", name: "ويدجت الموقع", en: "Website Widget", status: "مفعّل", color: C5.electric },
    { icon: "📘", name: "فيسبوك", en: "Facebook", status: "قريباً", color: "#1877F2" },
  ];
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="قنوات التواصل" titleEn="Communication Channels" episodeNum={25} />
      <div style={{ display: "flex", gap: 24, marginTop: 60, justifyContent: "center" }}>
        {channels.map((ch, i) => {
          const s = spring({ frame: frame - 55 - i * 18, fps, config: { damping: 18, stiffness: 160 } });
          return (
            <div key={i} style={{
              width: 240, padding: "36px 24px", borderRadius: 20, textAlign: "center",
              background: th.card, border: `1px solid ${th.borderSoft}`,
              opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{ch.icon}</div>
              <div style={{ fontFamily: cairo, fontSize: 22, fontWeight: 700, color: th.text, marginBottom: 6 }}>{ch.name}</div>
              <div style={{ fontFamily: mono, fontSize: 13, color: ch.color, marginBottom: 16 }}>{ch.en}</div>
              <div style={{
                fontFamily: cairo, fontSize: 14, fontWeight: 700, color: ch.status === "قريباً" ? th.muted : C5.emerald,
                padding: "6px 16px", borderRadius: 20,
                background: ch.status === "قريباً" ? `${th.muted}10` : `${C5.emerald}12`,
              }}>{ch.status}</div>
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
      <S5Header frame={frame} fps={fps} dark={dark} titleAr="أداء الوكيل الذكي" titleEn="AI Agent Performance" episodeNum={25} />
      <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
        <S5Stat frame={frame} fps={fps} dark={dark} delay={50} icon="💬" value="50K+" label="محادثة شهرية" labelEn="Monthly Chats" color={C5.electric} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⚡" value="<2s" label="زمن الرد" labelEn="Response Time" color={C5.violet} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={80} icon="📦" value="85%" label="تحويل لطلبات" labelEn="Order Conversion" color={C5.emerald} />
        <S5Stat frame={frame} fps={fps} dark={dark} delay={95} icon="⭐" value="4.8" label="رضا العملاء" labelEn="Satisfaction" color={C5.amber} />
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
        <TransitionSeries.Sequence durationInFrames={480}><S5Outro frame={0} fps={30} dark={dark} episodeNum={25} nextTitle="Quality AI" /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S5Background>
  );
};

export const Ep25Dark = () => <EpisodeVideo dark={true} />;
export const Ep25Light = () => <EpisodeVideo dark={false} />;
