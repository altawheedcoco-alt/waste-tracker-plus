/**
 * Media Utilities — أدوات اكتشاف ومعالجة الوسائط
 */

export type MediaType = 'image' | 'video' | 'audio' | 'pdf' | 'file';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.avif'];
const VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.wma', '.opus', '.webm'];
const PDF_EXTS = ['.pdf'];

const MIME_MAP: Record<string, MediaType> = {
  'image/': 'image',
  'video/': 'video',
  'audio/': 'audio',
  'application/pdf': 'pdf',
};

/**
 * Detect media type from URL extension or MIME type
 */
export function detectMediaType(url?: string | null, mimeType?: string | null): MediaType {
  if (!url && !mimeType) return 'file';

  // Check MIME type first
  if (mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    for (const [prefix, type] of Object.entries(MIME_MAP)) {
      if (mimeType.startsWith(prefix)) return type;
    }
  }

  if (!url) return 'file';

  // Clean URL (remove query params)
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();

  if (IMAGE_EXTS.some(ext => cleanUrl.endsWith(ext))) return 'image';
  if (VIDEO_EXTS.some(ext => cleanUrl.endsWith(ext))) return 'video';
  // Audio check: only match audio extensions, not video .webm
  if (AUDIO_EXTS.some(ext => cleanUrl.endsWith(ext)) && !cleanUrl.endsWith('.webm')) return 'audio';
  if (mimeType?.startsWith('audio/')) return 'audio';
  if (PDF_EXTS.some(ext => cleanUrl.endsWith(ext))) return 'pdf';

  return 'file';
}

/**
 * Check if URL is a playable media type
 */
export function isPlayableMedia(url?: string | null, mimeType?: string | null): boolean {
  const type = detectMediaType(url, mimeType);
  return type !== 'file';
}

/**
 * Get a human-readable label for the media type (Arabic)
 */
export function getMediaTypeLabel(type: MediaType): string {
  switch (type) {
    case 'image': return 'صورة';
    case 'video': return 'فيديو';
    case 'audio': return 'تسجيل صوتي';
    case 'pdf': return 'مستند PDF';
    case 'file': return 'ملف';
  }
}
