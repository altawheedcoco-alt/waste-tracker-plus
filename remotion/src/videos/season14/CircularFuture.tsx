import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🌱", ar: "من خطي إلى دائري", en: "Linear to Circular" },
    { icon: "💰", ar: "اقتصاد التريليون", en: "Trillion Dollar Economy" },
    { icon: "🧬", ar: "المواد الحيوية", en: "Bio-Materials" },
    { icon: "🌍", ar: "كوكب خالٍ من النفايات", en: "A Waste-Free Planet" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="مستقبل الاقتصاد الدائري" en="The Circular Future" dark={dark} icon="🔮" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep81Dark = () => <VideoContent dark />;
export const Ep81Light = () => <VideoContent dark={false} />;
