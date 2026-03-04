import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import MeetingsPanel from '@/components/meetings/MeetingsPanel';

const Meetings: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <MeetingsPanel />
      </div>
    </DashboardLayout>
  );
};

export default Meetings;
