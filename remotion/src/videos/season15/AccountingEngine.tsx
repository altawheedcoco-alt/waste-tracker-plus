import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { S15Background, S15Title, S15ContentSlide } from "./S15Common";

const VideoContent = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "📒", ar: "دفتر الأستاذ الذكي", en: "Smart Ledger" },
    { icon: "🧾", ar: "الفاتورة الإلكترونية", en: "E-Invoicing" },
    { icon: "💳", ar: "بوابات الدفع", en: "Payment Gateways" },
    { icon: "📊", ar: "لوحة مالية حية", en: "Live Financial Dashboard" }
  ];
  return (
    <AbsoluteFill>
      <S15Background dark={dark} />
      <Sequence from={0} durationInFrames={120}>
        <S15Title ar="محرك المحاسبة" en="Accounting Engine" dark={dark} icon="💰" />
      </Sequence>
      <Sequence from={120} durationInFrames={810}>
        <S15ContentSlide items={items} dark={dark} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const Ep85Dark = () => <VideoContent dark />;
export const Ep85Light = () => <VideoContent dark={false} />;
