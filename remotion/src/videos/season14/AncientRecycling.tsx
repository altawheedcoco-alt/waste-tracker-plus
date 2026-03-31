import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🏺", ar: "الحضارات القديمة", en: "Ancient Civilizations" },
    { icon: "⚒️", ar: "إعادة صهر المعادن", en: "Metal Resmelting" },
    { icon: "📜", ar: "جامعو الخردة", en: "Rag-and-Bone Men" },
    { icon: "🔄", ar: "مبدأ لا شيء يُهدر", en: "Nothing Goes to Waste" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="التدوير عبر التاريخ" en="Recycling Through the Ages" dark={dark} icon="🏺" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep76Dark = () => <VideoContent dark />;
export const Ep76Light = () => <VideoContent dark={false} />;
