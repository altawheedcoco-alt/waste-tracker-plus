import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoLight } from "./MainVideoLight";
import { Video2Dark, Video2Light } from "./videos/Video2Features";
import { Video3Dark, Video3Light } from "./videos/Video3OrgTypes";
import { Video4Dark, Video4Light } from "./videos/Video4Journey";
import { Video5Dark, Video5Light } from "./videos/Video5CTA";
import { TawheedReel } from "./TawheedReel";

export const RemotionRoot = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="light" component={MainVideoLight} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="v2-dark" component={Video2Dark} durationInFrames={1350} fps={30} width={1920} height={1080} />
    <Composition id="v2-light" component={Video2Light} durationInFrames={1350} fps={30} width={1920} height={1080} />
    <Composition id="v3-dark" component={Video3Dark} durationInFrames={1350} fps={30} width={1920} height={1080} />
    <Composition id="v3-light" component={Video3Light} durationInFrames={1350} fps={30} width={1920} height={1080} />
    <Composition id="v4-dark" component={Video4Dark} durationInFrames={1710} fps={30} width={1920} height={1080} />
    <Composition id="v4-light" component={Video4Light} durationInFrames={1710} fps={30} width={1920} height={1080} />
    <Composition id="v5-dark" component={Video5Dark} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="v5-light" component={Video5Light} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="tawheed-reel" component={TawheedReel} durationInFrames={600} fps={30} width={1080} height={1920} />
  </>
);
