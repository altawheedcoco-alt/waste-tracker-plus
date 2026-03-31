import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S14Background, S14Title, S14ContentSlide } from "./S14Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "♻️", ar: "رمز التدوير ١٩٧٠", en: "The Recycling Symbol 1970" },
    { icon: "🌍", ar: "يوم الأرض", en: "Earth Day Movement" },
    { icon: "📦", ar: "فرز المواد", en: "Material Sorting" },
    { icon: "🏛️", ar: "التشريعات البيئية", en: "Environmental Legislation" }
  ];
  return (
    <AbsoluteFill>
      <S14Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S14Title ar="التدوير الحديث" en="Modern Recycling Movement" dark={dark} icon="♻️" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S14ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep78Dark = () => <VideoContent dark />;
export const Ep78Light = () => <VideoContent dark={false} />;
