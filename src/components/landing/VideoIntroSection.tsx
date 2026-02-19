import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Monitor } from 'lucide-react';

const VideoIntroSection = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
            <Monitor className="h-4 w-4" />
            شاهد وتعرّف
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            تعرّف على iRecycle في 60 ثانية 🎬
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            شاهد كيف تساعدك المنصة في إدارة وتتبع المخلفات بكفاءة واحترافية
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card aspect-video group"
        >
          {!playing ? (
            /* Placeholder / Thumbnail */
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-emerald-600/90 to-teal-700/90 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => setPlaying(true)}
            >
              {/* Decorative pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60" />
              
              {/* Play button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-2xl group-hover:bg-white/30 transition-all"
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white mr-[-3px]" />
              </motion.div>

              <p className="relative z-10 text-white/90 font-bold mt-5 text-lg">اضغط للمشاهدة</p>
              <p className="relative z-10 text-white/60 text-sm mt-1">فيديو تعريفي قصير عن المنصة</p>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute top-8 right-8 text-4xl opacity-30"
              >♻️</motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute bottom-8 left-8 text-4xl opacity-30"
              >🌍</motion.div>
            </div>
          ) : (
            /* Embedded Video - placeholder YouTube embed */
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
              title="تعرّف على iRecycle"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          💡 يمكنك تحديث رابط الفيديو لاحقاً من إعدادات المنصة
        </motion.p>
      </div>
    </section>
  );
};

export default VideoIntroSection;
