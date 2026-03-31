import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📱", ar: "التطبيقات الذكية", en: "Smart Applications" },
    { icon: "📡", ar: "IoT والمستشعرات", en: "IoT Sensors" },
    { icon: "🤖", ar: "الفرز الآلي", en: "Automated Sorting" },
    { icon: "📊", ar: "البيانات الضخمة", en: "Big Data Analytics" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="التحول الرقمي" en="Digital Transformation in Waste" dark={dark} icon="💻" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep79Dark = () => <VideoContent dark />;
export const Ep79Light = () => <VideoContent dark={false} />;
