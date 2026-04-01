import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProgressProps {
  fileName: string;
  progress: number; // 0-100
  isVisible: boolean;
  fileType?: string;
}

const FileUploadProgress = ({ fileName, progress, isVisible, fileType }: FileUploadProgressProps) => {
  const Icon = fileType?.startsWith('image/') ? ImageIcon
    : fileType?.startsWith('video/') ? Video
    : FileText;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          className="px-3 py-2 border-t border-border bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {progress < 100 ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Icon className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{fileName}</p>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(progress)}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileUploadProgress;
