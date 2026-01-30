import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPreviewPlayerProps {
  imageUrl: string | null;
  scenes: string[];
  script: string;
  title: string;
  duration?: number; // in seconds
}

const VideoPreviewPlayer = ({ 
  imageUrl, 
  scenes, 
  script, 
  title,
  duration = 30 
}: VideoPreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenSceneRef = useRef<number>(-1);

  const sceneDuration = (duration * 1000) / scenes.length;

  // Initialize Arabic voice
  const getArabicVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    // Try to find an Arabic male voice
    const arabicVoice = voices.find(voice => 
      voice.lang.startsWith('ar') && voice.name.toLowerCase().includes('male')
    ) || voices.find(voice => 
      voice.lang.startsWith('ar')
    ) || voices.find(voice => 
      voice.lang === 'ar-EG'
    ) || voices[0];
    return arabicVoice;
  }, []);

  // Speak current scene
  const speakScene = useCallback((sceneText: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sceneText);
    utterance.voice = getArabicVoice();
    utterance.lang = 'ar-EG';
    utterance.rate = 0.9;
    utterance.pitch = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, getArabicVoice]);

  // Load voices when available
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Handle scene changes and speech
  useEffect(() => {
    if (isPlaying && currentSceneIndex !== lastSpokenSceneRef.current && scenes[currentSceneIndex]) {
      lastSpokenSceneRef.current = currentSceneIndex;
      speakScene(scenes[currentSceneIndex]);
    }
  }, [currentSceneIndex, isPlaying, scenes, speakScene]);

  // Stop speech when paused or muted
  useEffect(() => {
    if (!isPlaying || isMuted) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [isPlaying, isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (duration * 10));
          
          if (newProgress >= 100) {
            setIsPlaying(false);
            setCurrentSceneIndex(0);
            window.speechSynthesis?.cancel();
            return 0;
          }
          
          // Calculate which scene we should be on
          const sceneProgress = (newProgress / 100) * scenes.length;
          const newSceneIndex = Math.min(Math.floor(sceneProgress), scenes.length - 1);
          
          if (newSceneIndex !== currentSceneIndex) {
            setCurrentSceneIndex(newSceneIndex);
          }
          
          return newProgress;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, duration, scenes.length, currentSceneIndex]);

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
    } else if (progress === 0) {
      lastSpokenSceneRef.current = -1; // Reset to speak first scene
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    window.speechSynthesis?.cancel();
    setProgress(0);
    setCurrentSceneIndex(0);
    lastSpokenSceneRef.current = -1;
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis?.cancel();
    }
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div 
      className={`relative rounded-xl overflow-hidden bg-black ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}
      layout
    >
      <AspectRatio ratio={16 / 9}>
        {/* Background Image/Video */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <motion.img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: isPlaying ? 1.05 : 1 }}
              transition={{ duration: sceneDuration / 1000, ease: "linear" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 flex items-center justify-center">
              <motion.div
                animate={{ 
                  rotate: isPlaying ? 360 : 0,
                  scale: isPlaying ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="text-white/30 text-9xl"
              >
                ♻️
              </motion.div>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Scene Text Overlay */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSceneIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-x-0 bottom-20 px-6 text-center"
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-white text-lg font-medium leading-relaxed" dir="rtl">
                {scenes[currentSceneIndex]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Title */}
        <motion.div 
          className="absolute top-4 right-4 left-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-primary/90 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            <h3 className="text-white font-bold text-lg" dir="rtl">{title}</h3>
          </div>
        </motion.div>

        {/* Scene Indicator */}
        <div className="absolute top-4 left-4 flex gap-1">
          {scenes.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSceneIndex 
                  ? 'bg-primary w-6' 
                  : index < currentSceneIndex 
                    ? 'bg-white' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && progress === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Button
              onClick={handlePlayPause}
              size="lg"
              className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary shadow-2xl"
            >
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </Button>
          </motion.div>
        )}

        {/* Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
          {/* Progress Bar */}
          <div className="mb-3">
            <Progress value={progress} className="h-1 bg-white/20" />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRestart}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleMute}
                className={`text-white hover:bg-white/20 ${isSpeaking ? 'animate-pulse' : ''}`}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              <span className="text-white/70 text-sm mr-2">
                {Math.floor((progress / 100) * duration)}s / {duration}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">
                مشهد {currentSceneIndex + 1} من {scenes.length}
              </span>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </AspectRatio>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/80 -z-10"
          onClick={toggleFullscreen}
        />
      )}
    </motion.div>
  );
};

export default VideoPreviewPlayer;
