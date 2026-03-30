import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12 } from "./S12Common";
const TR = 30;
const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="البلوكشين وكربون كريدت" titleEn="Blockchain & Carbon Credits" subtitle="تتبع شفاف وغير قابل للتلاعب لدورة حياة كل طن مخلفات" episodeNum={65} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 45 }}>
      <S12Feature frame={frame} fps={fps} dark={dark} delay={55} icon="⛓️" titleAr="سلسلة الكتل" titleEn="Blockchain Ledger" desc="سجل غير قابل للتلاعب لكل عملية — من المصدر حتى إعادة التدوير النهائية" color={C12.prism} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={73} icon="🌱" titleAr="رصيد الكربون" titleEn="Carbon Credits" desc="حساب تلقائي لرصيد الكربون المحقق من إعادة التدوير مع شهادات رقمية" color={C12.mint} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={91} icon="💎" titleAr="NFT بيئي" titleEn="Environmental NFTs" desc="شهادات NFT للمنشآت تثبت إنجازاتها البيئية وتسويقها كقيمة تجارية" color={C12.holo} />
      <S12Feature frame={frame} fps={fps} dark={dark} delay={109} icon="🔄" titleAr="تداول الكربون" titleEn="Carbon Trading" desc="سوق تداول رصيد الكربون — بيع وشراء بين المنشآت بشفافية كاملة" color={C12.solar} />
    </div>
  </AbsoluteFill>
);};
const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="أرقام البلوكشين" titleEn="Blockchain Impact" episodeNum={65} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="⛓️" value="100%" label="شفافية كاملة" labelEn="Full Transparency" color={C12.prism} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🌱" value="50K+" label="طن كربون" labelEn="Carbon Tons" color={C12.mint} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="💎" value="NFT" label="شهادات رقمية" labelEn="Digital Certs" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="💰" value="P2P" label="تداول مباشر" labelEn="Peer Trading" color={C12.solar} />
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
      <TransitionSeries.Sequence durationInFrames={480}><S12Outro frame={0} fps={30} dark={dark} episodeNum={65} nextTitle="Circular Economy" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};
export const Ep65Dark = () => <EpisodeVideo dark={true} />;
export const Ep65Light = () => <EpisodeVideo dark={false} />;
