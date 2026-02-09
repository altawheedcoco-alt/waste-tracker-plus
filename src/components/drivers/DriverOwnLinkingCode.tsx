import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Check, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DriverOwnLinkingCode = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: driver } = useQuery({
    queryKey: ['driver-own-code', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, linking_code')
        .eq('profile_id', profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!profile?.id,
  });

  const code = driver?.linking_code;
  if (!code) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'تم النسخ', description: `تم نسخ كود الربط: ${code}` });
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={copyCode}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          <span className="mr-1">{copied ? 'تم' : 'نسخ'}</span>
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-base px-3 py-1 bg-primary/5 border-primary/20">
            {code}
          </Badge>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link className="w-4 h-4 text-primary" />
            كود الربط الخاص بك
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverOwnLinkingCode;
