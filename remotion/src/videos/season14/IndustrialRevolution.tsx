import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "💨", ar: "انفجار النفايات", en: "The Waste Explosion" },
    { icon: "🗑️", ar: "أول أنظمة الجمع", en: "First Collection Systems" },
    { icon: "📰", ar: "تدوير الورق", en: "Paper Recycling Origins" },
    { icon: "⚗️", ar: "الكيمياء والتحويل", en: "Chemistry & Conversion" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="الثورة الصناعية" en="Industrial Revolution & Waste" dark={dark} icon="🏭" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep77Dark = () => <VideoContent dark />;
export const Ep77Light = () => <VideoContent dark={false} />;
