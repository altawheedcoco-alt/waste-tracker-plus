// Re-export from new modular structure for backward compatibility
export {
  AuthProvider,
  useAuth,
  useAuthState,
  useUserData,
  useAuthActions,
  type Profile,
  type Organization,
  type UserOrganization,
  type SignUpData,
  type DriverSignUpData,
} from './auth';

// Re-export stopFocusMusicOnLogout for internal use
export { stopFocusMusicOnLogout } from './FocusMusicContext';
