import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📄", ar: "تقارير PDF/Excel", en: "PDF & Excel Reports" },
    { icon: "📉", ar: "تحليلات تفاعلية", en: "Interactive Analytics" },
    { icon: "🔄", ar: "تقارير دورية آلية", en: "Automated Periodic Reports" },
    { icon: "📤", ar: "مشاركة وتصدير", en: "Share & Export" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="التقارير المتقدمة" en="Advanced Reporting Suite" dark={dark} icon="📊" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep83Dark = () => <VideoContent dark />;
export const Ep83Light = () => <VideoContent dark={false} />;
