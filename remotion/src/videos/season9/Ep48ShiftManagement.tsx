import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S9Background, S9Header, S9Outro, S9Feature, S9Stat, C9 } from "./S9Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="إدارة الورديات" titleEn="Shift & Schedule Management" subtitle="تنظيم ذكي للورديات مع مراعاة الإجازات والعطلات" episodeNum={48} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S9Feature frame={frame} fps={fps} dark={dark} delay={55} icon="📅" titleAr="جدول الورديات" titleEn="Shift Calendar" desc="تقويم تفاعلي لتنظيم الورديات — صباحية، مسائية، ليلية — مع تبديل تلقائي" color={C9.olive} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔄" titleAr="التبديل الآلي" titleEn="Auto Swap" desc="نظام تبادل ورديات ذكي يسمح للعمال بتبديل مناوباتهم مع موافقة تلقائية" color={C9.khaki} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={91} icon="⏰" titleAr="الحضور والانصراف" titleEn="Attendance Tracking" desc="تسجيل حضور بالموقع الجغرافي والتعرف على الوجه مع تقارير دقيقة" color={C9.tactical} />
      <S9Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🏖️" titleAr="إدارة الإجازات" titleEn="Leave Management" desc="طلب واعتماد الإجازات إلكترونياً مع حساب الرصيد التلقائي" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S9Header frame={frame} fps={fps} dark={dark} titleAr="كفاءة الورديات" titleEn="Shift Efficiency" episodeNum={48} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S9Stat frame={frame} fps={fps} dark={dark} delay={50} icon="📅" value="24/7" label="تغطية كاملة" labelEn="Full Coverage" color={C9.olive} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={65} icon="⏱️" value="95%" label="الالتزام بالمواعيد" labelEn="Punctuality" color={C9.khaki} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔄" value="<2h" label="وقت التبديل" labelEn="Swap Time" color={C9.tactical} />
      <S9Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="30%" label="تقليل الغياب" labelEn="Less Absence" color={C9.amber} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S9Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S9Outro frame={0} fps={30} dark={dark} episodeNum={48} nextTitle="Safety & HSE" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S9Background>
);};
export const Ep48Dark = () => <EpisodeVideo dark={true} />;
export const Ep48Light = () => <EpisodeVideo dark={false} />;
