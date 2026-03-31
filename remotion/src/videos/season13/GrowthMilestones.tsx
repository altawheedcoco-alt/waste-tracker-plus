import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🏭", ar: "أول عميل صناعي", en: "First Industrial Client" },
    { icon: "📊", ar: "١٠٠٠ شحنة", en: "1,000 Shipments Milestone" },
    { icon: "🌍", ar: "التوسع الإقليمي", en: "Regional Expansion" },
    { icon: "🏆", ar: "جوائز وتقدير", en: "Awards & Recognition" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="محطات النمو" en="Growth Milestones" dark={dark} icon="📈" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep71Dark = () => <VideoContent dark />;
export const Ep71Light = () => <VideoContent dark={false} />;
