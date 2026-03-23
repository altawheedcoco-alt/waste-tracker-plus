import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoLight } from "./MainVideoLight";

export const RemotionRoot = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="light" component={MainVideoLight} durationInFrames={900} fps={30} width={1920} height={1080} />
  </>
);
