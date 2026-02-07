import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AwardLettersList from '@/components/award-letters/AwardLettersList';

export default function AwardLettersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <AwardLettersList />
      </div>
    </DashboardLayout>
  );
}
