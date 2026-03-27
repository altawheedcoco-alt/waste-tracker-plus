import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoLight } from "./MainVideoLight";
import { Video2Dark, Video2Light } from "./videos/Video2Features";
import { Video3Dark, Video3Light } from "./videos/Video3OrgTypes";
import { Video4Dark, Video4Light } from "./videos/Video4Journey";
import { Video5Dark, Video5Light } from "./videos/Video5CTA";
import { TawheedReel } from "./TawheedReel";
import { PlatformShowcase } from "./videos/PlatformShowcase";
import { Ep2Dark, Ep2Light } from "./videos/episodes/Ep2Shipments";
import { Ep3Dark, Ep3Light } from "./videos/episodes/Ep3AI";
import { Ep4Dark, Ep4Light } from "./videos/episodes/Ep4Fleet";
import { Ep5Dark, Ep5Light } from "./videos/episodes/Ep5Reports";

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
    <Composition id="platform-showcase" component={PlatformShowcase} durationInFrames={1350} fps={30} width={1920} height={1080} />
    {/* Series Episodes */}
    <Composition id="ep2-dark" component={Ep2Dark} durationInFrames={1140} fps={30} width={1920} height={1080} />
    <Composition id="ep2-light" component={Ep2Light} durationInFrames={1140} fps={30} width={1920} height={1080} />
    <Composition id="ep3-dark" component={Ep3Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep3-light" component={Ep3Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep4-dark" component={Ep4Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep4-light" component={Ep4Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep5-dark" component={Ep5Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep5-light" component={Ep5Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
  </>
);
