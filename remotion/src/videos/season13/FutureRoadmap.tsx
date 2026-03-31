import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🌐", ar: "التوسع العالمي", en: "Global Expansion" },
    { icon: "🤖", ar: "الأتمتة الكاملة", en: "Full Automation" },
    { icon: "♻️", ar: "صفر نفايات", en: "Zero Waste Target" },
    { icon: "🏙️", ar: "مدن ذكية", en: "Smart City Partnerships" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="خارطة المستقبل" en="Future Roadmap 2025-2030" dark={dark} icon="🗺️" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep75Dark = () => <VideoContent dark />;
export const Ep75Light = () => <VideoContent dark={false} />;
