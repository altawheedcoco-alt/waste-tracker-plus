import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📱", ar: "من ويب إلى PWA", en: "From Web to PWA" },
    { icon: "🧠", ar: "دمج الذكاء الاصطناعي", en: "AI Integration" },
    { icon: "☁️", ar: "البنية السحابية", en: "Cloud Architecture" },
    { icon: "🔒", ar: "الأمان المتقدم", en: "Advanced Security" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="التطور التقني" en="Technical Evolution" dark={dark} icon="⚙️" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep73Dark = () => <VideoContent dark />;
export const Ep73Light = () => <VideoContent dark={false} />;
