import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface DownloadOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
}

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook محسّن لتحميل الملفات مع تتبع التقدم
 */
export function useFileDownload() {
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const downloadFile = useCallback(async (
    url: string,
    options: DownloadOptions = {}
  ) => {
    const { filename, onProgress } = options;

    // Create abort controller
    abortControllerRef.current = new AbortController();

    setState({ isDownloading: true, progress: 0, error: null });

    const toastId = toast.loading('جاري التحميل...', {
      description: '0%',
    });

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        const progress = total ? Math.round((loaded / total) * 100) : 50;
        setState(prev => ({ ...prev, progress }));
        onProgress?.(progress);

        toast.loading('جاري التحميل...', {
          id: toastId,
          description: `${progress}%`,
        });
      }

      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const blob = new Blob([combined]);
      const blobUrl = URL.createObjectURL(blob);

      // Extract filename from URL if not provided
      const finalFilename = filename || url.split('/').pop() || 'download';

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFilename;
      link.click();

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      setState({ isDownloading: false, progress: 100, error: null });
      toast.dismiss(toastId);
      toast.success('تم التحميل بنجاح');

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.dismiss(toastId);
        toast.info('تم إلغاء التحميل');
        setState({ isDownloading: false, progress: 0, error: null });
      } else {
        const errorMessage = (error as Error).message || 'فشل التحميل';
        setState({ isDownloading: false, progress: 0, error: errorMessage });
        toast.dismiss(toastId);
        toast.error('فشل التحميل');
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Quick download without progress tracking
  const quickDownload = useCallback(async (url: string, filename?: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || url.split('/').pop() || 'download';
      link.target = '_blank';
      link.click();
      toast.success('بدأ التحميل');
    } catch (error) {
      toast.error('فشل بدء التحميل');
    }
  }, []);

  return {
    downloadFile,
    quickDownload,
    abort,
    ...state,
  };
}

export default useFileDownload;
