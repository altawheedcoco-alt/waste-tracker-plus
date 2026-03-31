import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📉", ar: "تقليل التكاليف ٤٠٪", en: "40% Cost Reduction" },
    { icon: "⏱️", ar: "توفير الوقت ٦٠٪", en: "60% Time Saved" },
    { icon: "📄", ar: "صفر أوراق", en: "Zero Paperwork" },
    { icon: "🏆", ar: "شهادة ISO", en: "ISO Certification" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="قصة مصنع ناجح" en="Factory Success Story" dark={dark} icon="🏭" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep88Dark = () => <VideoContent dark />;
export const Ep88Light = () => <VideoContent dark={false} />;
