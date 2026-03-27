import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Type, X, Send, Bold, Italic, AlignCenter, Image, Smile, Link2, MapPin } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useStories } from '@/hooks/useStories';
import { toast } from 'sonner';

const GRADIENT_OPTIONS = [
  { bg: 'bg-gradient-to-br from-primary to-primary/60', label: 'أساسي' },
  { bg: 'bg-gradient-to-br from-blue-500 to-purple-700', label: 'أزرق' },
  { bg: 'bg-gradient-to-br from-rose-500 to-pink-700', label: 'وردي' },
  { bg: 'bg-gradient-to-br from-amber-500 to-orange-700', label: 'برتقالي' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-blue-700', label: 'سماوي' },
  { bg: 'bg-gradient-to-br from-violet-500 to-indigo-700', label: 'بنفسجي' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-700', label: 'أخضر' },
  { bg: 'bg-gradient-to-br from-red-600 to-rose-900', label: 'أحمر' },
  { bg: 'bg-gradient-to-br from-gray-800 to-gray-950', label: 'داكن' },
  { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', label: 'ذهبي' },
];

const FONT_OPTIONS = [
  { label: 'عادي', className: 'font-sans', value: 'sans' },
  { label: 'عريض', className: 'font-bold', value: 'bold' },
  { label: 'مائل', className: 'italic', value: 'italic' },
];

const FONT_SIZE_OPTIONS = [
  { label: 'ص', size: 'text-base', value: 'sm' },
  { label: 'م', size: 'text-xl', value: 'md' },
  { label: 'ك', size: 'text-3xl', value: 'lg' },
];

const EMOJI_STICKERS = ['🚀', '💡', '🎯', '✅', '📦', '🏭', '♻️', '🌍', '💪', '⭐', '🔥', '❤️'];

interface StoryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryUploadDialog = ({ open, onOpenChange }: StoryUploadDialogProps) => {
  const [mode, setMode] = useState<'select' | 'image' | 'text'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(GRADIENT_OPTIONS[0].bg);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedSize, setSelectedSize] = useState(FONT_SIZE_OPTIONS[1]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadStory } = useStories();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 50 * 1024 * 1024) {
        toast.error('حجم الملف يتجاوز 50 ميجابايت');
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
      setMode('image');
    }
  };

  const handleSubmit = async () => {
    if (mode === 'image' && file) {
      await uploadStory.mutateAsync({ file, caption: caption || linkUrl ? `${caption}${linkUrl ? `\n🔗 ${linkUrl}` : ''}` : undefined });
    } else if (mode === 'text' && textContent.trim()) {
      await uploadStory.mutateAsync({ textContent, backgroundColor: selectedBg });
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode('select');
    setFile(null);
    setPreview(null);
    setCaption('');
    setTextContent('');
    setLinkUrl('');
    setShowLinkInput(false);
    setShowEmojiPicker(false);
    setSelectedFont(FONT_OPTIONS[0]);
    setSelectedSize(FONT_SIZE_OPTIONS[1]);
    onOpenChange(false);
  };

  const insertEmoji = (emoji: string) => {
    if (mode === 'text') {
      setTextContent(prev => prev + emoji);
    } else {
      setCaption(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const charCount = textContent.length;
  const maxChars = 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" dir="rtl">
        <AnimatePresence mode="wait">
          {/* Mode Selection */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-4"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold">نشر حالة جديدة</h3>
                <p className="text-xs text-muted-foreground">شارك لحظاتك مع شركائك • تختفي بعد 24 ساعة</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium block">صورة / فيديو</span>
                    <span className="text-[10px] text-muted-foreground">حتى 50 ميجا</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode('text')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Type className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium block">حالة نصية</span>
                    <span className="text-[10px] text-muted-foreground">10 خلفيات متنوعة</span>
                  </div>
                </motion.button>
              </div>

              {/* Recent stories hint */}
              <p className="text-[10px] text-center text-muted-foreground/60">
                💡 نصيحة: الحالات مع صور تحصل على مشاهدات أكثر بـ 3x
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Image/Video Preview */}
          {mode === 'image' && preview && (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              <div className="relative aspect-[9/16] max-h-[55vh] overflow-hidden bg-black">
                {file?.type.startsWith('video') ? (
                  <video src={preview} className="w-full h-full object-contain" controls />
                ) : (
                  <img src={preview} className="w-full h-full object-contain" alt="preview" />
                )}
                <button
                  onClick={() => { setMode('select'); setFile(null); setPreview(null); }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* File info badge */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] flex items-center gap-1">
                  {file?.type.startsWith('video') ? '🎥' : '📷'}
                  <span>{(file!.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Caption with toolbar */}
                <div className="relative">
                  <Input
                    placeholder="أضف تعليقاً... (اختياري)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="text-right pr-3 pl-20"
                    maxLength={200}
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button
                      onClick={() => setShowEmojiPicker(e => !e)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowLinkInput(l => !l)}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${showLinkInput ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Link input */}
                <AnimatePresence>
                  {showLinkInput && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <Input
                        placeholder="أضف رابط (اختياري)"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="text-right text-xs"
                        dir="ltr"
                        type="url"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Emoji picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg">
                        {EMOJI_STICKERS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => insertEmoji(emoji)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-primary/10 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSubmit}
                  disabled={uploadStory.isPending}
                  className="w-full gap-2"
                  variant="eco"
                >
                  <Send className="w-4 h-4" />
                  {uploadStory.isPending ? 'جاري النشر...' : 'نشر الحالة'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Text Story Editor */}
          {mode === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              <div className={`aspect-[9/16] max-h-[45vh] ${selectedBg} flex items-center justify-center p-8 relative transition-all duration-300`}>
                <Textarea
                  value={textContent}
                  onChange={(e) => {
                    if (e.target.value.length <= maxChars) {
                      setTextContent(e.target.value);
                    }
                  }}
                  placeholder="اكتب حالتك هنا..."
                  className={`bg-transparent border-none text-white text-center ${selectedSize.size} ${selectedFont.className} placeholder:text-white/50 resize-none focus-visible:ring-0 h-full drop-shadow-lg`}
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                  dir="rtl"
                />
                <button
                  onClick={() => setMode('select')}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Emoji button */}
                <button
                  onClick={() => setShowEmojiPicker(e => !e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {/* Char counter */}
                <div className={`absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] ${charCount > maxChars * 0.9 ? 'bg-red-500/60 text-white' : 'bg-black/30 text-white/80'}`}>
                  {charCount}/{maxChars}
                </div>

                {/* Inline emoji picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-12 right-3 bg-black/60 backdrop-blur-lg rounded-xl p-2 flex flex-wrap gap-1 max-w-[180px] z-20"
                    >
                      {EMOJI_STICKERS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-white/20 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-4 space-y-3">
                {/* Font style buttons */}
                <div className="flex items-center justify-center gap-2">
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setSelectedSize(size)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${
                        selectedSize.value === size.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-border mx-1" />
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border transition-all ${
                        selectedFont.value === font.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {font.value === 'bold' ? <Bold className="w-3.5 h-3.5" /> : font.value === 'italic' ? <Italic className="w-3.5 h-3.5" /> : <AlignCenter className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                {/* Background colors - scrollable */}
                <div className="flex gap-2 justify-start overflow-x-auto pb-1 scrollbar-none">
                  {GRADIENT_OPTIONS.map(({ bg, label }) => (
                    <button
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className="flex flex-col items-center gap-0.5 min-w-fit"
                    >
                      <div className={`w-8 h-8 rounded-full ${bg} border-2 transition-all ${
                        selectedBg === bg ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'
                      }`} />
                      <span className={`text-[8px] ${selectedBg === bg ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{label}</span>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!textContent.trim() || uploadStory.isPending}
                  className="w-full gap-2"
                  variant="eco"
                >
                  <Send className="w-4 h-4" />
                  {uploadStory.isPending ? 'جاري النشر...' : 'نشر الحالة'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default StoryUploadDialog;
