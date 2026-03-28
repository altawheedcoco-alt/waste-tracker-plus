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
import { Ep6Dark, Ep6Light } from "./videos/season2/Ep6Marketplace";
import { Ep7Dark, Ep7Light } from "./videos/season2/Ep7Quality";
import { Ep8Dark, Ep8Light } from "./videos/season2/Ep8Portal";
import { Ep9Dark, Ep9Light } from "./videos/season2/Ep9API";
import { Ep10Dark, Ep10Light } from "./videos/season2/Ep10Sustainability";
import { Ep11Dark, Ep11Light } from "./videos/season3/Ep11Notifications";
import { Ep12Dark, Ep12Light } from "./videos/season3/Ep12Finance";
import { Ep13Dark, Ep13Light } from "./videos/season3/Ep13Workforce";
import { Ep14Dark, Ep14Light } from "./videos/season3/Ep14CallCenter";
import { Ep15Dark, Ep15Light } from "./videos/season3/Ep15Compliance";

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
    {/* Series Episodes - Season 1 */}
    <Composition id="ep2-dark" component={Ep2Dark} durationInFrames={1140} fps={30} width={1920} height={1080} />
    <Composition id="ep2-light" component={Ep2Light} durationInFrames={1140} fps={30} width={1920} height={1080} />
    <Composition id="ep3-dark" component={Ep3Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep3-light" component={Ep3Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep4-dark" component={Ep4Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep4-light" component={Ep4Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep5-dark" component={Ep5Dark} durationInFrames={1160} fps={30} width={1920} height={1080} />
    <Composition id="ep5-light" component={Ep5Light} durationInFrames={1160} fps={30} width={1920} height={1080} />
    {/* Series Episodes - Season 2 (Tech Product Style) */}
    <Composition id="ep6-dark" component={Ep6Dark} durationInFrames={2075} fps={30} width={1920} height={1080} />
    <Composition id="ep6-light" component={Ep6Light} durationInFrames={2075} fps={30} width={1920} height={1080} />
    <Composition id="ep7-dark" component={Ep7Dark} durationInFrames={1995} fps={30} width={1920} height={1080} />
    <Composition id="ep7-light" component={Ep7Light} durationInFrames={1995} fps={30} width={1920} height={1080} />
    <Composition id="ep8-dark" component={Ep8Dark} durationInFrames={2035} fps={30} width={1920} height={1080} />
    <Composition id="ep8-light" component={Ep8Light} durationInFrames={2035} fps={30} width={1920} height={1080} />
    <Composition id="ep9-dark" component={Ep9Dark} durationInFrames={2035} fps={30} width={1920} height={1080} />
    <Composition id="ep9-light" component={Ep9Light} durationInFrames={2035} fps={30} width={1920} height={1080} />
    <Composition id="ep10-dark" component={Ep10Dark} durationInFrames={2255} fps={30} width={1920} height={1080} />
    <Composition id="ep10-light" component={Ep10Light} durationInFrames={2255} fps={30} width={1920} height={1080} />
    {/* Series Episodes - Season 3 (Clean Futuristic Style) */}
    <Composition id="ep11-dark" component={Ep11Dark} durationInFrames={2950} fps={30} width={1920} height={1080} />
    <Composition id="ep11-light" component={Ep11Light} durationInFrames={2950} fps={30} width={1920} height={1080} />
    <Composition id="ep12-dark" component={Ep12Dark} durationInFrames={2980} fps={30} width={1920} height={1080} />
    <Composition id="ep12-light" component={Ep12Light} durationInFrames={2980} fps={30} width={1920} height={1080} />
    <Composition id="ep13-dark" component={Ep13Dark} durationInFrames={2970} fps={30} width={1920} height={1080} />
    <Composition id="ep13-light" component={Ep13Light} durationInFrames={2970} fps={30} width={1920} height={1080} />
    <Composition id="ep14-dark" component={Ep14Dark} durationInFrames={2990} fps={30} width={1920} height={1080} />
    <Composition id="ep14-light" component={Ep14Light} durationInFrames={2990} fps={30} width={1920} height={1080} />
    <Composition id="ep15-dark" component={Ep15Dark} durationInFrames={3000} fps={30} width={1920} height={1080} />
    <Composition id="ep15-light" component={Ep15Light} durationInFrames={3000} fps={30} width={1920} height={1080} />
  </>
);
