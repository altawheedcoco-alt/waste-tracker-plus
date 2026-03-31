import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "👷", ar: "١٠٠٠ وظيفة جديدة", en: "1,000 New Jobs" },
    { icon: "🎓", ar: "برامج تدريبية", en: "Training Programs" },
    { icon: "🏘️", ar: "أحياء نظيفة", en: "Cleaner Neighborhoods" },
    { icon: "💚", ar: "وعي بيئي", en: "Environmental Awareness" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="الأثر المجتمعي" en="Community & Social Impact" dark={dark} icon="🤝" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep92Dark = () => <VideoContent dark />;
export const Ep92Light = () => <VideoContent dark={false} />;
