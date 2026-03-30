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
import { Ep16Dark, Ep16Light } from "./videos/season4/Ep16ShipmentLifecycle";
import { Ep17Dark, Ep17Light } from "./videos/season4/Ep17WasteTypes";
import { Ep18Dark, Ep18Light } from "./videos/season4/Ep18Documentation";
import { Ep19Dark, Ep19Light } from "./videos/season4/Ep19Weighbridge";
import { Ep20Dark, Ep20Light } from "./videos/season4/Ep20Pricing";
import { Ep21Dark, Ep21Light } from "./videos/season4/Ep21SafeDisposal";
import { Ep22Dark, Ep22Light } from "./videos/season5/Ep22DocumentAI";
import { Ep23Dark, Ep23Light } from "./videos/season5/Ep23WasteAI";
import { Ep24Dark, Ep24Light } from "./videos/season5/Ep24HealthAI";
import { Ep25Dark, Ep25Light } from "./videos/season5/Ep25ChatAgent";
import { Ep26Dark, Ep26Light } from "./videos/season5/Ep26QualityAI";
import { Ep27Dark, Ep27Light } from "./videos/season5/Ep27StrategicAI";
import { Ep28Dark, Ep28Light } from "./videos/season6/Ep28WorkflowAutomation";
import { Ep29Dark, Ep29Light } from "./videos/season6/Ep29RouteOptimization";
import { Ep30Dark, Ep30Light } from "./videos/season6/Ep30Scheduling";
import { Ep31Dark, Ep31Light } from "./videos/season6/Ep31Security";
import { Ep32Dark, Ep32Light } from "./videos/season6/Ep32MobileOps";
import { Ep33Dark, Ep33Light } from "./videos/season6/Ep33BusinessIntelligence";

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
    {/* Series Episodes - Season 4 (Shipments Deep Dive) */}
    <Composition id="ep16-dark" component={Ep16Dark} durationInFrames={2950} fps={30} width={1920} height={1080} />
    <Composition id="ep16-light" component={Ep16Light} durationInFrames={2950} fps={30} width={1920} height={1080} />
    <Composition id="ep17-dark" component={Ep17Dark} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep17-light" component={Ep17Light} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep18-dark" component={Ep18Dark} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep18-light" component={Ep18Light} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep19-dark" component={Ep19Dark} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep19-light" component={Ep19Light} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep20-dark" component={Ep20Dark} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep20-light" component={Ep20Light} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep21-dark" component={Ep21Dark} durationInFrames={2930} fps={30} width={1920} height={1080} />
    <Composition id="ep21-light" component={Ep21Light} durationInFrames={2930} fps={30} width={1920} height={1080} />
    {/* Series Episodes - Season 5 (AI Deep Dive - Neural Digital) */}
    <Composition id="ep22-dark" component={Ep22Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep22-light" component={Ep22Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep23-dark" component={Ep23Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep23-light" component={Ep23Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep24-dark" component={Ep24Dark} durationInFrames={2010} fps={30} width={1920} height={1080} />
    <Composition id="ep24-light" component={Ep24Light} durationInFrames={2010} fps={30} width={1920} height={1080} />
    <Composition id="ep25-dark" component={Ep25Dark} durationInFrames={2010} fps={30} width={1920} height={1080} />
    <Composition id="ep25-light" component={Ep25Light} durationInFrames={2010} fps={30} width={1920} height={1080} />
    <Composition id="ep26-dark" component={Ep26Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep26-light" component={Ep26Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep27-dark" component={Ep27Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep27-light" component={Ep27Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    {/* Series Episodes - Season 6 (Operations & Automation - Cyber Industrial) */}
    <Composition id="ep28-dark" component={Ep28Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep28-light" component={Ep28Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep29-dark" component={Ep29Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep29-light" component={Ep29Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep30-dark" component={Ep30Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep30-light" component={Ep30Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep31-dark" component={Ep31Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep31-light" component={Ep31Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep32-dark" component={Ep32Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep32-light" component={Ep32Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep33-dark" component={Ep33Dark} durationInFrames={2030} fps={30} width={1920} height={1080} />
    <Composition id="ep33-light" component={Ep33Light} durationInFrames={2030} fps={30} width={1920} height={1080} />
  </>
);
