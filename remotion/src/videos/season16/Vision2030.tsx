import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S16Background, S16Title, S16ContentSlide } from "./S16Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🎯", ar: "أهداف التنمية المستدامة", en: "UN SDGs Alignment" },
    { icon: "🌐", ar: "شراكات عالمية", en: "Global Partnerships" },
    { icon: "🚀", ar: "التوسع القادم", en: "Next Expansion" },
    { icon: "💫", ar: "عالم أنظف", en: "A Cleaner World" }
  ];
  return (
    <AbsoluteFill>
      <S16Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S16Title ar="رؤية ٢٠٣٠" en="Vision 2030 — A Greener World" dark={dark} icon="🌍" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S16ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep93Dark = () => <VideoContent dark />;
export const Ep93Light = () => <VideoContent dark={false} />;
