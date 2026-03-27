import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, Type, X, Send } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useStories } from '@/hooks/useStories';

const GRADIENT_OPTIONS = [
  'bg-gradient-to-br from-primary to-primary/60',
  'bg-gradient-to-br from-blue-500 to-purple-700',
  'bg-gradient-to-br from-rose-500 to-pink-700',
  'bg-gradient-to-br from-amber-500 to-orange-700',
  'bg-gradient-to-br from-cyan-500 to-blue-700',
  'bg-gradient-to-br from-violet-500 to-indigo-700',
];

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
  const [selectedBg, setSelectedBg] = useState(GRADIENT_OPTIONS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadStory } = useStories();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
      setMode('image');
    }
  };

  const handleSubmit = async () => {
    if (mode === 'image' && file) {
      await uploadStory.mutateAsync({ file, caption });
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" dir="rtl">
        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-center">نشر حالة جديدة</h3>
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
                  <span className="text-sm font-medium">صورة / فيديو</span>
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
                  <span className="text-sm font-medium">حالة نصية</span>
                </motion.button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {mode === 'image' && preview && (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              <div className="relative aspect-[9/16] max-h-[60vh] overflow-hidden bg-black">
                {file?.type.startsWith('video') ? (
                  <video src={preview} className="w-full h-full object-contain" controls />
                ) : (
                  <img src={preview} className="w-full h-full object-contain" alt="preview" />
                )}
                <button
                  onClick={() => { setMode('select'); setFile(null); setPreview(null); }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <Input
                  placeholder="أضف تعليقاً... (اختياري)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="text-right"
                />
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

          {mode === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              <div className={`aspect-[9/16] max-h-[50vh] ${selectedBg} flex items-center justify-center p-8 relative`}>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="اكتب حالتك هنا..."
                  className="bg-transparent border-none text-white text-center text-xl font-bold placeholder:text-white/50 resize-none focus-visible:ring-0 h-full"
                  dir="rtl"
                />
                <button
                  onClick={() => setMode('select')}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2 justify-center">
                  {GRADIENT_OPTIONS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className={`w-8 h-8 rounded-full ${bg} border-2 transition-all ${
                        selectedBg === bg ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                    />
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
