import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12 } from "./S12Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="الحوسبة الكمية" titleEn="Quantum Computing Applications" subtitle="استخدام قوة الحوسبة الكمية لحل أعقد مشاكل إدارة المخلفات" episodeNum={68} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S12Feature frame={frame} fps={fps} dark={dark} delay={55} icon="⚛️" titleAr="تحسين كمي" titleEn="Quantum Optimization" desc="حل مشاكل المسارات المعقدة لآلاف الشاحنات في ثوانٍ بدل ساعات" color={C12.holo} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🔬" titleAr="محاكاة المواد" titleEn="Material Simulation" desc="محاكاة كمية لخصائص المواد المعاد تدويرها واكتشاف استخدامات جديدة" color={C12.prism} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🧮" titleAr="تشفير كمي" titleEn="Quantum Encryption" desc="تشفير كمي غير قابل للاختراق لحماية البيانات البيئية الحساسة" color={C12.shine} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="نمذجة مناخية" titleEn="Climate Modeling" desc="نماذج كمية للتنبؤ بالأثر المناخي طويل المدى لسياسات إدارة المخلفات" color={C12.ice} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="أرقام الحوسبة الكمية" titleEn="Quantum Impact" episodeNum={68} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⚛️" value="1000x" label="سرعة المعالجة" labelEn="Processing Speed" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🔬" value="∞" label="احتمالات جديدة" labelEn="New Possibilities" color={C12.prism} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🔐" value="QKD" label="تشفير كمي" labelEn="Quantum Security" color={C12.shine} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🌍" value="2030" label="الجاهزية" labelEn="Ready By" color={C12.ice} />
    </div>
  </AbsoluteFill>
);};
const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S12Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={480}><S12Outro frame={0} fps={30} dark={dark} episodeNum={68} nextTitle="The Grand Finale" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};
export const Ep68Dark = () => <EpisodeVideo dark={true} />;
export const Ep68Light = () => <EpisodeVideo dark={false} />;
