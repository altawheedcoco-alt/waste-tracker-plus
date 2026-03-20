import { FileText, Truck, Receipt, FileSignature, Stamp, MapPin, BarChart3, Bot, Hash, Timer } from 'lucide-react';

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: any;
  resourceType: 'shipment' | 'invoice' | 'document' | 'signing_request' | 'stamp' | 'tracking' | 'poll' | 'ai' | 'channel' | 'disappear';
  color: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/shipment',
    label: 'شحنة',
    description: 'مشاركة بطاقة شحنة',
    icon: Truck,
    resourceType: 'shipment',
    color: 'text-emerald-600 bg-emerald-500/10',
  },
  {
    command: '/invoice',
    label: 'فاتورة',
    description: 'إرسال أو طلب فاتورة',
    icon: Receipt,
    resourceType: 'invoice',
    color: 'text-blue-600 bg-blue-500/10',
  },
  {
    command: '/doc',
    label: 'مستند',
    description: 'إرفاق مستند من الأرشيف',
    icon: FileText,
    resourceType: 'document',
    color: 'text-violet-600 bg-violet-500/10',
  },
  {
    command: '/sign',
    label: 'طلب توقيع',
    description: 'طلب توقيع على مستند',
    icon: FileSignature,
    resourceType: 'signing_request',
    color: 'text-amber-600 bg-amber-500/10',
  },
  {
    command: '/stamp',
    label: 'طلب ختم',
    description: 'طلب ختم رسمي على مستند',
    icon: Stamp,
    resourceType: 'stamp',
    color: 'text-rose-600 bg-rose-500/10',
  },
  {
    command: '/track',
    label: 'تتبع شحنة',
    description: 'مشاركة رابط تتبع مباشر',
    icon: MapPin,
    resourceType: 'tracking',
    color: 'text-teal-600 bg-teal-500/10',
  },
  {
    command: '/poll',
    label: 'تصويت',
    description: 'إنشاء تصويت سريع',
    icon: BarChart3,
    resourceType: 'poll',
    color: 'text-orange-600 bg-orange-500/10',
  },
  {
    command: '/ai',
    label: 'المساعد الذكي',
    description: 'استدعاء المساعد الذكي @ai',
    icon: Bot,
    resourceType: 'ai',
    color: 'text-purple-600 bg-purple-500/10',
  },
  {
    command: '/channel',
    label: 'قناة',
    description: 'إنشاء قناة مواضيعية',
    icon: Hash,
    resourceType: 'channel',
    color: 'text-sky-600 bg-sky-500/10',
  },
  {
    command: '/disappear',
    label: 'رسائل مؤقتة',
    description: 'تفعيل الرسائل المختفية',
    icon: Timer,
    resourceType: 'disappear',
    color: 'text-pink-600 bg-pink-500/10',
  },
];

export const filterCommands = (search: string): SlashCommand[] => {
  if (!search) return SLASH_COMMANDS;
  const q = search.toLowerCase().replace('/', '');
  return SLASH_COMMANDS.filter(
    c => c.command.includes(q) || c.label.includes(q) || c.description.includes(q)
  );
};
