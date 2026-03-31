import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🇩🇪", ar: "ألمانيا — ٦٥٪ تدوير", en: "Germany — 65% Rate" },
    { icon: "🇯🇵", ar: "اليابان — صفر نفايات", en: "Japan — Zero Waste" },
    { icon: "🇸🇪", ar: "السويد — طاقة من النفايات", en: "Sweden — Waste-to-Energy" },
    { icon: "🇪🇬", ar: "مصر — الفرصة الكبرى", en: "Egypt — The Big Opportunity" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="رواد التدوير عالمياً" en="Global Recycling Leaders" dark={dark} icon="🏆" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep80Dark = () => <VideoContent dark />;
export const Ep80Light = () => <VideoContent dark={false} />;
