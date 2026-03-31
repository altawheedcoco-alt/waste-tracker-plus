import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "🔐", ar: "تشفير شامل", en: "End-to-End Encryption" },
    { icon: "👤", ar: "مصادقة متعددة", en: "Multi-Factor Auth" },
    { icon: "📜", ar: "سجل التدقيق", en: "Audit Trail" },
    { icon: "🛡️", ar: "RLS والصلاحيات", en: "Row-Level Security" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="أمان المنصة" en="Platform Security Deep Dive" dark={dark} icon="🛡️" />
      </Sequence>
      <Sequence from={120} durationInFrames={1910}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep87Dark = () => <VideoContent dark />;
export const Ep87Light = () => <VideoContent dark={false} />;
