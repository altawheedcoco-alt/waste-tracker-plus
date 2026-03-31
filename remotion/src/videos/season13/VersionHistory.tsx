import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S13Background, S13Title, S13ContentSlide } from "./S13Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "v1", ar: "الإصدار الأول — الأساسيات", en: "v1 — Core Foundation" },
    { icon: "v3", ar: "القفزة الكبرى — AI", en: "v3 — The AI Leap" },
    { icon: "v4", ar: "المنصة المتكاملة", en: "v4 — Full Platform" },
    { icon: "v5", ar: "الذكاء السيادي", en: "v5 — Sovereign Intelligence" }
  ];
  return (
    <AbsoluteFill>
      <S13Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S13Title ar="سجل الإصدارات" en="Version History & Changelog" dark={dark} icon="📋" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S13ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep74Dark = () => <VideoContent dark />;
export const Ep74Light = () => <VideoContent dark={false} />;
