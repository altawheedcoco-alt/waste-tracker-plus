import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Truck, Recycle } from 'lucide-react';

interface OrganizationBreakdownProps {
  generatorCount: number;
  transporterCount: number;
  recyclerCount: number;
}

const OrganizationBreakdown = ({ 
  generatorCount, 
  transporterCount, 
  recyclerCount 
}: OrganizationBreakdownProps) => {
  const navigate = useNavigate();

  const organizations = [
    {
      label: 'الجهات المولدة',
      count: generatorCount,
      icon: Building2,
      color: 'blue',
    },
    {
      label: 'الجهات الناقلة',
      count: transporterCount,
      icon: Truck,
      color: 'amber',
    },
    {
      label: 'الجهات المدورة',
      count: recyclerCount,
      icon: Recycle,
      color: 'green',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {organizations.map((org) => (
        <Card 
          key={org.label}
          className={`cursor-pointer hover:border-${org.color}-500/50 transition-colors`} 
          onClick={() => navigate('/dashboard/partners')}
        >
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg bg-${org.color}-500/10 flex items-center justify-center`}>
                <org.icon className={`w-5 h-5 text-${org.color}-500`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{org.label}</p>
                <p className="text-2xl font-bold">{org.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrganizationBreakdown;
