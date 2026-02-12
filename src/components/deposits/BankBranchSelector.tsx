import { useState, useMemo } from 'react';
import { egyptianBanks, getBranchesForBank, type BankBranch } from '@/data/egyptianBanks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Landmark, MapPin, Search } from 'lucide-react';

interface BankBranchSelectorProps {
  bankName: string;
  branchName: string;
  onBankChange: (bankName: string) => void;
  onBranchChange: (branchName: string) => void;
  bankLabel?: string;
  branchLabel?: string;
  className?: string;
  showBranchCity?: boolean;
}

export default function BankBranchSelector({
  bankName,
  branchName,
  onBankChange,
  onBranchChange,
  bankLabel = 'اسم البنك',
  branchLabel = 'اسم الفرع',
  className = '',
  showBranchCity = true,
}: BankBranchSelectorProps) {
  const [bankSearch, setBankSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return egyptianBanks;
    const q = bankSearch.toLowerCase();
    return egyptianBanks.filter(
      b => b.name.includes(q) || b.nameEn.toLowerCase().includes(q) || b.shortName?.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  const branches = useMemo(() => {
    const all = getBranchesForBank(bankName);
    if (!branchSearch.trim()) return all;
    const q = branchSearch.toLowerCase();
    return all.filter(
      b => b.name.includes(q) || b.city.includes(q) || b.area?.includes(q)
    );
  }, [bankName, branchSearch]);

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* Bank Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
          {bankLabel}
        </Label>
        <Select
          value={bankName}
          onValueChange={(val) => {
            onBankChange(val);
            onBranchChange('');
            setBranchSearch('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر البنك..." />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute right-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="ابحث عن بنك..."
                  className="h-8 pr-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filteredBanks.map((bank) => (
              <SelectItem key={bank.id} value={bank.name}>
                <div className="flex items-center gap-2">
                  <span>{bank.name}</span>
                  {bank.shortName && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {bank.shortName}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {filteredBanks.length === 0 && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                لا توجد نتائج
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Branch Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {branchLabel}
        </Label>
        {bankName && branches.length > 0 ? (
          <Select value={branchName} onValueChange={onBranchChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الفرع..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 pb-2">
                <div className="relative">
                  <Search className="absolute right-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="ابحث عن فرع..."
                    className="h-8 pr-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              {branches.map((branch, idx) => (
                <SelectItem key={`${branch.name}-${idx}`} value={branch.name}>
                  <div className="flex items-center gap-2">
                    <span>{branch.name}</span>
                    {showBranchCity && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {branch.city}{branch.area ? ` - ${branch.area}` : ''}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              {branches.length === 0 && (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  لا توجد فروع مطابقة
                </div>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={branchName}
            onChange={(e) => onBranchChange(e.target.value)}
            placeholder={bankName ? 'لا توجد فروع محفوظة - أدخل يدوياً' : 'اختر البنك أولاً'}
            disabled={!bankName}
          />
        )}
      </div>
    </div>
  );
}
