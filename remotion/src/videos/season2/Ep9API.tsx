import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { S2Background, SectionHeader, StatCard, FeatureItem, S2Outro, cairo, inter, mono, COLORS, theme } from "./S2Common";

const TRANS = 25;

// Scene 1: API & Integration
const Scene1 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = theme(dark);

  // Animated code block
  const codeLines = [
    { text: 'const client = new iRecycle({', delay: 40 },
    { text: '  apiKey: "ir_live_xxx...",', delay: 50 },
    { text: '  region: "ME"', delay: 58 },
    { text: '});', delay: 64 },
    { text: '', delay: 70 },
    { text: 'const shipment = await client', delay: 80 },
    { text: '  .shipments.create({', delay: 88 },
    { text: '    type: "hazardous",', delay: 96 },
    { text: '    weight_kg: 450,', delay: 104 },
    { text: '    pickup: "2025-01-15"', delay: 112 },
    { text: '  });', delay: 118 },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="تكامل الأنظمة و API" titleEn="System Integration & Open API" subtitle="ربط iRecycle مع أنظمتك الحالية بسلاسة" episodeNum={9} />

      <div style={{ display: "flex", gap: 50, marginTop: 40 }}>
        {/* Code block */}
        <div style={{
          flex: 1.2, background: dark ? "#0D1117" : "#1E293B", borderRadius: 12,
          border: `1px solid ${dark ? "#30363D" : "#334155"}`, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
            borderBottom: `1px solid ${dark ? "#21262D" : "#334155"}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />
            <div style={{ fontFamily: mono, fontSize: 11, color: "#8B949E", marginLeft: 12 }}>create-shipment.ts</div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {codeLines.map((line, i) => {
              const lineS = spring({ frame: frame - line.delay, fps, config: { damping: 20, stiffness: 200 } });
              const typedChars = Math.floor(interpolate(lineS, [0, 1], [0, line.text.length]));
              const visibleText = line.text.substring(0, typedChars);
              const cursor = lineS > 0 && lineS < 0.99;
              // Color syntax
              const colored = visibleText
                .replace(/(const|await|new)/g, '<span style="color:#FF7B72">$1</span>')
                .replace(/(".*?")/g, '<span style="color:#A5D6FF">$1</span>')
                .replace(/(\.[\w]+)/g, '<span style="color:#D2A8FF">$1</span>')
                .replace(/(\d+)/g, '<span style="color:#79C0FF">$1</span>');

              return (
                <div key={i} style={{ display: "flex", gap: 16, height: 26 }}>
                  <div style={{ fontFamily: mono, fontSize: 13, color: "#484F58", width: 24, textAlign: "right" }}>{i + 1}</div>
                  <div style={{ fontFamily: mono, fontSize: 14, color: "#E6EDF3" }} dangerouslySetInnerHTML={{ __html: colored + (cursor ? '<span style="color:#22996E">|</span>' : '') }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Integration cards */}
        <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "🔗", name: "REST API", desc: "واجهة برمجية كاملة" },
            { icon: "🪝", name: "Webhooks", desc: "إشعارات أحداث فورية" },
            { icon: "📚", name: "SDK Libraries", desc: "مكتبات جاهزة" },
            { icon: "🔄", name: "ERP Sync", desc: "مزامنة مع SAP/Oracle" },
            { icon: "📊", name: "Gov Portal", desc: "ربط مع الحكومة الإلكترونية" },
          ].map((item, i) => {
            const s = spring({ frame: frame - 80 - i * 15, fps, config: { damping: 16 } });
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: "14px 18px", opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
              }}>
                <div style={{ fontSize: 26 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily: inter, fontSize: 15, fontWeight: 700, color: t.text }}>{item.name}</div>
                  <div style={{ fontFamily: cairo, fontSize: 13, color: t.muted }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: API Features
const Scene2 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { titleAr: "توثيق تفاعلي", titleEn: "Interactive API Docs", desc: "وثائق API تفاعلية مع أمثلة حية وبيئة اختبار مدمجة (Swagger/OpenAPI)", color: COLORS.green },
    { titleAr: "مصادقة متعددة", titleEn: "Multi-Auth Support", desc: "دعم OAuth 2.0 ومفاتيح API و JWT مع صلاحيات دقيقة لكل نقطة وصول", color: COLORS.blue },
    { titleAr: "حدود استخدام ذكية", titleEn: "Smart Rate Limiting", desc: "إدارة ذكية لحصص الاستخدام مع تنبيهات قبل الوصول للحد الأقصى", color: "#F59E0B" },
    { titleAr: "سجل تغييرات الإصدارات", titleEn: "Versioned Changelog", desc: "إصدارات API متعددة مع توافق عكسي وسجل تغييرات مفصل", color: "#8B5CF6" },
  ];

  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="قوة الـ API" titleEn="API Power Features" episodeNum={9} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 40 }}>
        {features.map((f, i) => (
          <div key={i} style={{ padding: "0 8px" }}>
            <FeatureItem frame={frame} fps={fps} dark={dark} delay={30 + i * 18} titleAr={f.titleAr} titleEn={f.titleEn} desc={f.desc} color={f.color} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Stats
const Scene3 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "80px 100px", direction: "rtl" }}>
      <SectionHeader frame={frame} fps={fps} dark={dark} titleAr="إحصائيات الـ API" titleEn="API Statistics" episodeNum={9} />
      <div style={{ display: "flex", gap: 24, marginTop: 50, justifyContent: "center", flexWrap: "wrap" }}>
        <StatCard frame={frame} fps={fps} dark={dark} delay={30} icon="⚡" value="<50ms" label="متوسط الاستجابة" labelEn="Avg Latency" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={45} icon="🔌" value="120+" label="نقطة وصول API" labelEn="API Endpoints" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={60} icon="📈" value="99.9%" label="وقت التشغيل" labelEn="Uptime" />
        <StatCard frame={frame} fps={fps} dark={dark} delay={75} icon="🌍" value="10+" label="تكامل جاهز" labelEn="Ready Integrations" />
      </div>
    </AbsoluteFill>
  );
};

const Scene4 = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <S2Outro frame={frame} fps={fps} dark={dark} episodeNum={9} nextTitle="Sustainability" />;
};

const Ep9Content = ({ dark }: { dark: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <S2Background frame={frame} dark={dark}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={680}><Scene1 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={550}><Scene2 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={480}><Scene3 dark={dark} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS })} />
        <TransitionSeries.Sequence durationInFrames={400}><Scene4 dark={dark} /></TransitionSeries.Sequence>
      </TransitionSeries>
    </S2Background>
  );
};

export const Ep9Dark = () => <Ep9Content dark />;
export const Ep9Light = () => <Ep9Content dark={false} />;
