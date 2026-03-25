import { useEffect, useState } from 'react';
import { AlertTriangle, X, Wifi } from 'lucide-react';

const OFFLINE_MODE_KEY = '__offline_mode';

export default function OfflineModeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(OFFLINE_MODE_KEY) === 'true');
  }, []);

  if (!show) return null;

  const deactivate = () => {
    localStorage.removeItem(OFFLINE_MODE_KEY);
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm" dir="rtl">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>⚡ الوضع المحلي التجريبي — البيانات وهمية والخلفية غير متصلة</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={deactivate} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-2 py-0.5 text-xs">
          <Wifi className="h-3 w-3" />
          إعادة الاتصال
        </button>
        <button onClick={() => setShow(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}