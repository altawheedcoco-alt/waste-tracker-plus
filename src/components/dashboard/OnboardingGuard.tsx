interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  // Onboarding enforcement is currently disabled — bypass all checks
  return <>{children}</>;
};

export default OnboardingGuard;
