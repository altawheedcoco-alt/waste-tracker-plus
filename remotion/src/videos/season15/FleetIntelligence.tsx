import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📍", ar: "تتبع GPS حي", en: "Live GPS Tracking" },
    { icon: "⛽", ar: "إدارة الوقود", en: "Fuel Management" },
    { icon: "🔧", ar: "الصيانة التنبؤية", en: "Predictive Maintenance" },
    { icon: "👨‍✈️", ar: "رادار القرب", en: "Proximity Radar" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="ذكاء الأسطول" en="Fleet Intelligence System" dark={dark} icon="🚛" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep84Dark = () => <VideoContent dark />;
export const Ep84Light = () => <VideoContent dark={false} />;
