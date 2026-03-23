import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import DriverSelfTracker from '@/components/driver/DriverSelfTracker';
import { Route as RouteIcon } from 'lucide-react';

const DriverMyRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <RouteIcon className="w-6 h-6 text-primary" />
              تتبع مساري
            </h1>
            <p className="text-sm text-muted-foreground">سجّل مسارك ونقاط توقفك والمسافة والسرعة لحظياً</p>
          </div>
        </div>
        <DriverSelfTracker />
      </div>
    </DashboardLayout>
  );
};

export default DriverMyRoute;
