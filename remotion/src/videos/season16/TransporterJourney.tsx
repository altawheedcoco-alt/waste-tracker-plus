import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📱", ar: "من الورقة للشاشة", en: "Paper to Screen" },
    { icon: "🗺️", ar: "تحسين المسارات", en: "Route Optimization" },
    { icon: "💰", ar: "زيادة الأرباح", en: "Revenue Growth" },
    { icon: "⭐", ar: "تقييم ٥ نجوم", en: "5-Star Rating" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="رحلة ناقل" en="Transporter's Digital Journey" dark={dark} icon="🚛" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep89Dark = () => <VideoContent dark />;
export const Ep89Light = () => <VideoContent dark={false} />;
