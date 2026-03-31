import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🧑‍💼", ar: "المؤسسون", en: "The Founders" },
    { icon: "🛠️", ar: "فريق التطوير", en: "Engineering Team" },
    { icon: "📞", ar: "فريق الدعم", en: "Support Heroes" },
    { icon: "🤝", ar: "ثقافة العمل", en: "Company Culture" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="فريق العمل" en="The Team Behind iRecycle" dark={dark} icon="👥" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep72Dark = () => <VideoContent dark />;
export const Ep72Light = () => <VideoContent dark={false} />;
