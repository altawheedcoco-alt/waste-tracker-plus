import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Features } from "./scenes/Scene4Features";
import { Scene5Outro } from "./scenes/Scene5Outro";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: cairoFamily } = loadCairo("normal", { weights: ["400", "700", "900"], subsets: ["arabic", "latin"] });
const { fontFamily: interFamily } = loadInter("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const fonts = { cairo: cairoFamily, inter: interFamily };

const TRANS = 20;

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Persistent animated background
  const bgHue = interpolate(frame, [0, 900], [160, 200]);
  const bgShift = interpolate(frame, [0, 900], [0, 30]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${135 + bgShift}deg, #0a1a14 0%, hsl(${bgHue}, 40%, 8%) 50%, #0d0d1e 100%)` }}>
      {/* Floating particles */}
      <FloatingParticles frame={frame} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={165}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />
        <TransitionSeries.Sequence durationInFrames={165}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />
        <TransitionSeries.Sequence durationInFrames={250}>
          <Scene3Solution />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />
        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene4Features />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })}
        />
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene5Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const FloatingParticles = ({ frame }: { frame: number }) => {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = (i * 173 + 50) % 1920;
    const baseY = (i * 137 + 100) % 1080;
    const y = baseY + Math.sin((frame + i * 30) * 0.02) * 40;
    const size = 3 + (i % 4) * 2;
    const opacity = interpolate(
      Math.sin((frame + i * 50) * 0.015),
      [-1, 1],
      [0.03, 0.12]
    );
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#22996E" : i % 3 === 1 ? "#2dd4a8" : "#ffffff",
          opacity,
        }}
      />
    );
  });
  return <AbsoluteFill>{particles}</AbsoluteFill>;
};
