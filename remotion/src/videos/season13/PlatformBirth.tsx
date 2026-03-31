import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "💡", ar: "فكرة من مشكلة حقيقية", en: "Born from a Real Problem" },
    { icon: "👨‍💻", ar: "أول سطر كود", en: "The First Line of Code" },
    { icon: "🎯", ar: "الرؤية الأولى", en: "The Original Vision" },
    { icon: "🚀", ar: "من فكرة إلى منتج", en: "From Idea to Product" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="ولادة المنصة" en="The Birth of iRecycle" dark={dark} icon="🌱" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep70Dark = () => <VideoContent dark />;
export const Ep70Light = () => <VideoContent dark={false} />;
