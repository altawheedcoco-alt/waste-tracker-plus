import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Building2,
  Package,
  Loader2,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AwardLetterForm from './AwardLetterForm';

interface AwardLetter {
  id: string;
  letter_number: string;
  title: string;
  issue_date: string;
  start_date: string;
  end_date: string | null;
  status: string;
  partner_organization_id: string | null;
  partner?: { name: string } | null;
  items_count?: number;
}

export default function AwardLettersList() {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: letters = [], isLoading, refetch } = useQuery({
    queryKey: ['award-letters', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('award_letters')
        .select(`
          id,
          letter_number,
          title,
          issue_date,
          start_date,
          end_date,
          status,
          partner_organization_id,
          partner:organizations!award_letters_partner_organization_id_fkey(name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get items count for each letter
      const lettersWithCounts = await Promise.all(
        (data || []).map(async (letter) => {
          const { count } = await supabase
            .from('award_letter_items')
            .select('*', { count: 'exact', head: true })
            .eq('award_letter_id', letter.id);

          return {
            ...letter,
            items_count: count || 0,
          };
        })
      );

      return lettersWithCounts as AwardLetter[];
    },
    enabled: !!organization?.id,
  });

  const filteredLetters = letters.filter(letter =>
    letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.letter_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, endDate: string | null) => {
    const isExpired = endDate && new Date(endDate) < new Date();
    
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive gap-1">
          <XCircle className="h-3 w-3" />
          منتهي
        </Badge>
      );
    }

    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1">
            <CheckCircle className="h-3 w-3" />
            ساري
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            مسودة
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            خطابات الترسية
          </h1>
          <p className="text-muted-foreground">
            إدارة خطابات الترسية والأسعار المعتمدة مع الشركاء
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              خطاب ترسية جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء خطاب ترسية جديد</DialogTitle>
            </DialogHeader>
            <AwardLetterForm
              onSuccess={() => {
                setIsFormOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالعنوان أو رقم الخطاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Letters List */}
      {filteredLetters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد خطابات ترسية</h3>
            <p className="text-muted-foreground mb-4">
              قم بإنشاء أول خطاب ترسية لتحديد أسعار المخلفات مع الشركاء
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء خطاب ترسية
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {filteredLetters.map(letter => (
              <Card
                key={letter.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/dashboard/award-letters/${letter.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {letter.letter_number}
                        </Badge>
                        {getStatusBadge(letter.status, letter.end_date)}
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{letter.title}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(letter.start_date), 'dd MMM yyyy', { locale: ar })}
                          {letter.end_date && (
                            <>
                              {' → '}
                              {format(new Date(letter.end_date), 'dd MMM yyyy', { locale: ar })}
                            </>
                          )}
                        </span>

                        {letter.partner && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {letter.partner.name}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {letter.items_count} بند سعر
                        </span>
                      </div>
                    </div>

                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
