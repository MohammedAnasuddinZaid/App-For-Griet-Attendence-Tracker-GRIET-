import type { AuthProvider, AuthUser, SyncProvider, SyncStatus } from '@/types'

// Local-only authentication. No cloud, no OTP, no fake SMS.
// The app is fully functional without an account.
export class LocalAuthProvider implements AuthProvider {
  readonly kind = 'LocalAuthProvider'
  private user: AuthUser | null = null

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.user
  }

  async isAuthenticated(): Promise<boolean> {
    return this.user !== null
  }

  async signInAsGuest(): Promise<AuthUser> {
    this.user = { id: 'local-guest', name: 'Guest', isGuest: true }
    return this.user
  }

  async signOut(): Promise<void> {
    this.user = null
  }
}

// Local sync provider: all data stays on-device. Cloud sync can be wired in
// later behind this same interface (opt-in only).
export class LocalOnlySyncProvider implements SyncProvider {
  status: SyncStatus = 'LOCAL_ONLY'
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async pushChanges(): Promise<void> {}
  async pullChanges(): Promise<void> {}
  async sync(): Promise<void> {
    this.status = 'LOCAL_ONLY'
  }
  getSyncStatus(): SyncStatus {
    return 'LOCAL_ONLY'
  }
}

export const authProvider = new LocalAuthProvider()
export const syncProvider = new LocalOnlySyncProvider()