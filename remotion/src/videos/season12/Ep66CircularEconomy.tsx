import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12 } from "./S12Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="الاقتصاد الدائري" titleEn="Circular Economy Platform" subtitle="تحويل المخلفات من مشكلة إلى مورد اقتصادي بقيمة تريليون دولار" episodeNum={66} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S12Feature frame={frame} fps={fps} dark={dark} delay={55} icon="♻️" titleAr="صفر نفايات" titleEn="Zero Waste Goal" desc="استراتيجية شاملة لتحقيق صفر نفايات — تقليل، إعادة استخدام، إعادة تدوير" color={C12.mint} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🏭" titleAr="تحويل المخلفات" titleEn="Waste-to-Resource" desc="تحويل كل أنواع المخلفات لمنتجات ذات قيمة — وقود، أسمدة، مواد بناء" color={C12.prism} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={91} icon="🌍" titleAr="شبكة عالمية" titleEn="Global Network" desc="ربط المنتجين بالمعالجين عبر شبكة عالمية لتعظيم قيمة كل طن" color={C12.holo} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={109} icon="📊" titleAr="مؤشر الدائرية" titleEn="Circularity Index" desc="مقياس رقمي لمدى تحقيق الاقتصاد الدائري مع مقارنات قطاعية" color={C12.solar} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="تأثير الاقتصاد الدائري" titleEn="Circular Economy Impact" episodeNum={66} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="♻️" value="95%" label="معدل التدوير" labelEn="Recycling Rate" color={C12.mint} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="💰" value="$1T" label="قيمة السوق" labelEn="Market Value" color={C12.solar} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🌍" value="50+" label="دولة متصلة" labelEn="Connected Countries" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="📊" value="A+" label="مؤشر الدائرية" labelEn="Circularity Grade" color={C12.prism} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S12Outro frame={0} fps={30} dark={dark} episodeNum={66} nextTitle="Smart Cities" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};
export const Ep66Dark = () => <EpisodeVideo dark={true} />;
export const Ep66Light = () => <EpisodeVideo dark={false} />;
