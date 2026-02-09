import { useState } from 'react';
import { Table2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type TableStyle = 'classic' | 'modern' | 'striped' | 'minimal' | 'colored';

interface TableStyleOption {
  id: TableStyle;
  label: string;
  description: string;
}

const TABLE_STYLES: TableStyleOption[] = [
  { id: 'classic', label: 'كلاسيكي', description: 'إطار كامل مع ترويسة ملونة' },
  { id: 'modern', label: 'عصري', description: 'بدون إطار خارجي مع خطوط فاصلة' },
  { id: 'striped', label: 'مخطط', description: 'صفوف متناوبة الألوان' },
  { id: 'minimal', label: 'بسيط', description: 'حد سفلي فقط بدون إطارات' },
  { id: 'colored', label: 'ملوّن', description: 'ترويسة ملونة بالكامل مع ظلال' },
];

interface Props {
  activeStyle: TableStyle;
  onStyleChange: (style: TableStyle) => void;
}

const TableStyleSelector = ({ activeStyle, onStyleChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="تنسيق الجداول">
          <Table2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" side="top" align="start" dir="rtl">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">نمط الجداول</p>
        <div className="space-y-1">
          {TABLE_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => { onStyleChange(style.id); setOpen(false); }}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeStyle === style.id
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{style.label}</p>
                <p className="text-[10px] text-muted-foreground">{style.description}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const getTableStyleClasses = (style: TableStyle): string => {
  const base = `
    [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-primary [&_h1]:border-b-2 [&_h1]:border-primary/30 [&_h1]:pb-2 [&_h1]:mb-4
    [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-primary/90 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-r-4 [&_h2]:border-primary [&_h2]:pr-3
    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1
    [&_hr]:my-4 [&_hr]:border-border
    [&_strong]:text-primary/90
    [&_ul]:pr-5 [&_ol]:pr-5 [&_ul]:list-none [&_ol]:list-decimal
    [&_li]:mb-1
    [&_p]:mb-2 [&_p]:text-foreground/90
    [&_blockquote]:border-r-4 [&_blockquote]:border-primary/40 [&_blockquote]:pr-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
    [&_table]:w-full [&_table]:my-3
  `;

  const tableStyles: Record<TableStyle, string> = {
    classic: `
      [&_table]:border-collapse
      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs
      [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:bg-primary/10 [&_th]:font-bold [&_th]:text-primary
    `,
    modern: `
      [&_table]:border-collapse
      [&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs
      [&_th]:border-b-2 [&_th]:border-primary [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-bold [&_th]:text-primary
    `,
    striped: `
      [&_table]:border-collapse
      [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs [&_td]:border-b [&_td]:border-border/30
      [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:bg-primary/15 [&_th]:font-bold [&_th]:text-primary [&_th]:border-b [&_th]:border-primary/30
      [&_tr:nth-child(even)_td]:bg-muted/50
    `,
    minimal: `
      [&_table]:border-collapse
      [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_td]:border-b [&_td]:border-border/20
      [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b-2 [&_th]:border-border
    `,
    colored: `
      [&_table]:border-collapse [&_table]:rounded-lg [&_table]:overflow-hidden
      [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_td]:border-b [&_td]:border-primary/10
      [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-xs [&_th]:bg-primary [&_th]:text-primary-foreground [&_th]:font-bold
      [&_tr:nth-child(even)_td]:bg-primary/5
      [&_tr:hover_td]:bg-primary/10
    `,
  };

  return `${base} ${tableStyles[style]}`;
};

export default TableStyleSelector;
