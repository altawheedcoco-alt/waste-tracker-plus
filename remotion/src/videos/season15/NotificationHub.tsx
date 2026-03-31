import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📱", ar: "إشعارات فورية", en: "Push Notifications" },
    { icon: "📧", ar: "بريد تلقائي", en: "Automated Emails" },
    { icon: "🔊", ar: "تنبيهات صوتية", en: "Audio Alerts" },
    { icon: "⚡", ar: "أولويات ذكية", en: "Smart Priority" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="مركز الإشعارات" en="Notification Hub" dark={dark} icon="🔔" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep86Dark = () => <VideoContent dark />;
export const Ep86Light = () => <VideoContent dark={false} />;
