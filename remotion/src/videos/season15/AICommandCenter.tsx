import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🎯", ar: "تصنيف ذكي بالصور", en: "Visual AI Classification" },
    { icon: "📈", ar: "تنبؤ بالطلب", en: "Demand Prediction" },
    { icon: "💬", ar: "الوكيل المحادثاتي", en: "Conversational Agent" },
    { icon: "📝", ar: "توليد المستندات", en: "Document Generation" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="مركز قيادة الذكاء" en="AI Command Center" dark={dark} icon="🧠" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep82Dark = () => <VideoContent dark />;
export const Ep82Light = () => <VideoContent dark={false} />;
