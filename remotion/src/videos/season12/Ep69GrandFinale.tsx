import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { S12Background, S12Header, S12Outro, S12Feature, S12Stat, C12, t12, cairo, bigShoulders, ibm } from "./S12Common";
const TR = 30;

const Scene1 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const th = t12(dark); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="الختام الكبير" titleEn="The Grand Finale — iRecycle Vision 2030" subtitle="١٢ موسم • ٦٩ حلقة • رحلة شاملة في مستقبل إدارة المخلفات الذكية" episodeNum={69} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 40 }}>
      {[
        { icon: "🌱", s: "S01-02", t: "الأساسيات", c: C12.mint },
        { icon: "🔗", s: "S03-04", t: "التعمق", c: C12.prism },
        { icon: "🧠", s: "S05-06", t: "الذكاء", c: C12.holo },
        { icon: "📡", s: "S07-08", t: "IoT والمالية", c: C12.ice },
        { icon: "🎖️", s: "S09-10", t: "HR والقانون", c: C12.solar },
        { icon: "🚀", s: "S11-12", t: "المستقبل", c: C12.shine },
      ].map((item, i) => {
        const s = spring({ frame: frame - 50 - i * 12, fps, config: { damping: 18, stiffness: 160 } });
        return (
          <div key={i} style={{ padding: "20px 16px", borderRadius: 16, textAlign: "center", background: th.card, border: `1px solid ${item.c}15`, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontFamily: ibm, fontSize: 12, color: item.c, marginBottom: 6 }}>{item.s}</div>
            <div style={{ fontFamily: cairo, fontSize: 18, fontWeight: 700, color: th.text }}>{item.t}</div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);};

const Scene2 = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (
  <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
    <S12Header frame={frame} fps={fps} dark={dark} titleAr="إنجازات المنصة" titleEn="Platform Achievements" episodeNum={69} />
    <div style={{ display: "flex", gap: 28, marginTop: 60, justifyContent: "center" }}>
      <S12Stat frame={frame} fps={fps} dark={dark} delay={50} icon="🏆" value="12" label="موسم كامل" labelEn="Complete Seasons" color={C12.prism} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={65} icon="🎬" value="69" label="حلقة احترافية" labelEn="Pro Episodes" color={C12.holo} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={80} icon="🌍" value="360°" label="تغطية شاملة" labelEn="Full Coverage" color={C12.mint} />
      <S12Stat frame={frame} fps={fps} dark={dark} delay={95} icon="🚀" value="2030" label="رؤية المستقبل" labelEn="Future Vision" color={C12.shine} />
    </div>
  </AbsoluteFill>
);};

const EpisodeVideo = ({ dark }: { dark: boolean }) => { const frame = useCurrentFrame(); return (
  <S12Background frame={frame} dark={dark}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={700}><Scene1 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><Scene2 dark={dark} /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TR })} />
      <TransitionSeries.Sequence durationInFrames={600}><S12Outro frame={0} fps={30} dark={dark} episodeNum={69} /></TransitionSeries.Sequence>
    </TransitionSeries>
  </S12Background>
);};

export const Ep69Dark = () => <EpisodeVideo dark={true} />;
export const Ep69Light = () => <EpisodeVideo dark={false} />;
