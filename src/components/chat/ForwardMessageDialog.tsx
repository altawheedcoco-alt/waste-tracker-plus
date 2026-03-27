import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Forward, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatPartner } from './ChatSidebar';
import { soundEngine } from '@/lib/soundEngine';

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: ChatPartner[];
  messageContent: string;
  onForward: (targetPartnerId: string) => void;
}

const ForwardMessageDialog = ({
  open,
  onOpenChange,
  partners,
  messageContent,
  onForward,
}: ForwardMessageDialogProps) => {
  const [search, setSearch] = useState('');

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPreviewText = () => {
    try {
      const parsed = JSON.parse(messageContent);
      return parsed.text || messageContent;
    } catch {
      return messageContent.length > 80 ? messageContent.substring(0, 80) + '...' : messageContent;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="w-5 h-5 text-primary" />
            إعادة توجيه الرسالة
          </DialogTitle>
        </DialogHeader>

        {/* Message Preview */}
        <div className="bg-muted/50 border border-border rounded-xl p-3 mb-2">
          <p className="text-xs text-muted-foreground mb-1">الرسالة:</p>
          <p className="text-sm">{getPreviewText()}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن جهة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Partners List */}
        <ScrollArea className="max-h-64">
          <div className="space-y-1">
            {filtered.map((partner) => (
              <button
                key={partner.id}
                onClick={() => {
                  soundEngine.play('forward');
                  onForward(partner.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-right"
              >
                <Avatar className="h-10 w-10">
                  {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {partner.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{partner.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {partner.organization_type === 'generator' ? 'مولد نفايات' :
                     partner.organization_type === 'transporter' ? 'ناقل' : 'مُعيد تدوير'}
                  </p>
                </div>
                {partner.isOnline && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد نتائج</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
