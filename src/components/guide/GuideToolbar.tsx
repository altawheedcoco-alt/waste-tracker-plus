import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Volume2,
  VolumeX,
  Printer,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings2,
  ChevronDown,
  Gauge,
  FileText,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  content: string;
}

interface GuideToolbarProps {
  sections: GuideSection[];
  guideTitle: string;
  primaryColor?: string;
}

const GuideToolbar = ({ sections, guideTitle, primaryColor = 'blue' }: GuideToolbarProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      setIsSpeechSupported(false);
    }
    
    return () => {
      // Cleanup on unmount
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getArabicVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Try to find Arabic voice
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    return arabicVoice || voices[0];
  };

  const speakSection = (index: number) => {
    if (!isSpeechSupported || index >= sections.length) {
      stopSpeaking();
      return;
    }

    const section = sections[index];
    const textToSpeak = `${section.title}. ${section.content.replace(/[•📈♻️💰📋📌✅🛡️📜🏆🗺️📊🔔🚛📍📦🎯⏱️📏⚡]/g, '')}`;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-EG';
    utterance.rate = speechRate;
    utterance.volume = isMuted ? 0 : volume;
    
    // Wait for voices to load
    if (window.speechSynthesis.getVoices().length > 0) {
      utterance.voice = getArabicVoice();
    }
    
    utterance.onend = () => {
      // Move to next section
      if (index < sections.length - 1) {
        setCurrentSectionIndex(index + 1);
        speakSection(index + 1);
      } else {
        stopSpeaking();
        toast.success('تم الانتهاء من قراءة الدليل');
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      if (event.error !== 'canceled') {
        toast.error('حدث خطأ في القراءة الصوتية');
        stopSpeaking();
      }
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    
    // Scroll to current section
    const element = document.getElementById(section.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const startSpeaking = () => {
    if (!isSpeechSupported) {
      toast.error('القراءة الصوتية غير مدعومة في هذا المتصفح');
      return;
    }
    
    setIsPlaying(true);
    setIsPaused(false);
    speakSection(currentSectionIndex);
    toast.success('بدأت القراءة الصوتية');
  };

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSectionIndex(0);
  };

  const skipToNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      window.speechSynthesis.cancel();
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);
      speakSection(nextIndex);
    }
  };

  const skipToPrevious = () => {
    if (currentSectionIndex > 0) {
      window.speechSynthesis.cancel();
      const prevIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevIndex);
      speakSection(prevIndex);
    }
  };

  const handlePrint = () => {
    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${guideTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Tajawal', 'Segoe UI', Arial, sans-serif;
            line-height: 1.8;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #1a1a1a;
            background: white;
          }
          
          h1 {
            text-align: center;
            font-size: 28px;
            margin-bottom: 10px;
            color: #1e3a8a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 15px;
          }
          
          .subtitle {
            text-align: center;
            color: #64748b;
            margin-bottom: 30px;
          }
          
          .toc {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .toc h2 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #1e3a8a;
          }
          
          .toc ul {
            list-style: none;
            padding: 0;
            margin: 0;
            columns: 2;
          }
          
          .toc li {
            padding: 5px 0;
            font-size: 14px;
          }
          
          .toc li::before {
            content: "•";
            color: #3b82f6;
            margin-left: 8px;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-header {
            background: linear-gradient(to left, #eff6ff, #dbeafe);
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            border-right: 4px solid #3b82f6;
          }
          
          .section-number {
            font-size: 12px;
            color: #3b82f6;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 5px 0 0 0;
          }
          
          .section-content {
            padding: 20px;
            background: #fafafa;
            border-radius: 0 0 8px 8px;
            white-space: pre-line;
            font-size: 14px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
          }
          
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
            .toc { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <h1>📘 ${guideTitle}</h1>
        <p class="subtitle">منصة آي ريسايكل لإدارة المخلفات</p>
        
        <div class="toc">
          <h2>📑 فهرس المحتويات</h2>
          <ul>
            ${sections.map((s, i) => `<li>${i + 1}. ${s.title}</li>`).join('')}
          </ul>
        </div>
        
        ${sections.map((section, i) => `
          <div class="section">
            <div class="section-header">
              <div class="section-number">القسم ${i + 1}</div>
              <h3 class="section-title">${section.title}</h3>
            </div>
            <div class="section-content">${section.content.replace(/\n/g, '<br>')}</div>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>تم إنشاء هذا المستند من منصة آي ريسايكل</p>
          <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for fonts to load
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      toast.success('جاري تحضير الطباعة...');
    } else {
      toast.error('فشل في فتح نافذة الطباعة');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current && isPlaying) {
      // Update volume in real-time if playing
      utteranceRef.current.volume = isMuted ? volume : 0;
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Title & Section Info */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {sections.length} أقسام
            </Badge>
            
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2"
                >
                  <Badge className={`bg-${primaryColor}-500`}>
                    <span className="animate-pulse ml-1">●</span>
                    القسم {currentSectionIndex + 1}: {sections[currentSectionIndex]?.title}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Text-to-Speech Controls */}
            {isSpeechSupported && (
              <div className="flex items-center gap-1 border-l border-border pl-3 ml-1">
                {!isPlaying ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startSpeaking}
                    className="gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span className="hidden sm:inline">قراءة صوتية</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToPrevious}
                      disabled={currentSectionIndex === 0}
                      className="h-8 w-8"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={isPaused ? resumeSpeaking : pauseSpeaking}
                      className="h-8 w-8"
                    >
                      {isPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={stopSpeaking}
                      className="h-8 w-8"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToNext}
                      disabled={currentSectionIndex === sections.length - 1}
                      className="h-8 w-8"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="h-8 w-8"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
                
                {/* Speech Settings */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">إعدادات القراءة</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            سرعة القراءة
                          </span>
                          <span className="text-sm font-medium">{speechRate}x</span>
                        </div>
                        <Slider
                          value={[speechRate]}
                          onValueChange={([value]) => setSpeechRate(value)}
                          min={0.5}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            مستوى الصوت
                          </span>
                          <span className="text-sm font-medium">{Math.round(volume * 100)}%</span>
                        </div>
                        <Slider
                          value={[volume]}
                          onValueChange={([value]) => setVolume(value)}
                          min={0}
                          max={1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Jump to Section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  انتقل إلى
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sections.map((section, i) => (
                  <DropdownMenuItem
                    key={section.id}
                    onClick={() => {
                      const element = document.getElementById(section.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      if (isPlaying) {
                        window.speechSynthesis.cancel();
                        setCurrentSectionIndex(i);
                        speakSection(i);
                      }
                    }}
                    className={currentSectionIndex === i && isPlaying ? 'bg-primary/10' : ''}
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs ml-2">
                      {i + 1}
                    </span>
                    {section.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Print Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideToolbar;
