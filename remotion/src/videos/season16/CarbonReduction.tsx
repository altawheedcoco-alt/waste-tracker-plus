import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📉", ar: "خفض CO2 بنسبة ٣٥٪", en: "35% CO2 Reduction" },
    { icon: "🔋", ar: "طاقة متجددة", en: "Renewable Energy" },
    { icon: "🏭", ar: "مصانع خضراء", en: "Green Factories" },
    { icon: "📜", ar: "أرصدة كربونية", en: "Carbon Credits" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="خفض الكربون" en="Carbon Footprint Reduction" dark={dark} icon="🌿" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep91Dark = () => <VideoContent dark />;
export const Ep91Light = () => <VideoContent dark={false} />;
