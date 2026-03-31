import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🌍", ar: "١٠٠٠ طن مدورة", en: "1,000 Tons Recycled" },
    { icon: "🌳", ar: "٥٠٠ شجرة محفوظة", en: "500 Trees Saved" },
    { icon: "💧", ar: "مليون لتر مياه", en: "1M Liters Water Saved" },
    { icon: "📊", ar: "تقرير ESG معتمد", en: "Certified ESG Report" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="أثر المُدوِّر" en="Recycler's Environmental Impact" dark={dark} icon="♻️" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep90Dark = () => <VideoContent dark />;
export const Ep90Light = () => <VideoContent dark={false} />;
