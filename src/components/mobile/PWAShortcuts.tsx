/**
 * PWA Shortcuts & Install Prompt
 * اختصارات الشاشة الرئيسية وزر التثبيت
 */
import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, X, Plus, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAShortcuts = memo(() => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
    });

    // Show iOS instructions after delay if not installed
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setInstallPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <Card className="shadow-xl border-primary/20 bg-card/95 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1">ثبّت التطبيق على جهازك</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    وصول أسرع مع إشعارات فورية وعمل بدون اتصال
                  </p>
                  {isIOS ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>اضغط <strong>مشاركة</strong> ثم <strong>"إضافة للشاشة الرئيسية"</strong></span>
                    </div>
                  ) : (
                    <Button onClick={handleInstall} size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      تثبيت التطبيق
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setShowBanner(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PWAShortcuts.displayName = 'PWAShortcuts';

export default PWAShortcuts;
