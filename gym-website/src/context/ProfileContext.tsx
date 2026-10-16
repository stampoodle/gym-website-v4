import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile } from '../types'

const PROFILE_KEY = 'gymtraina_profile_v1'

// No placeholder person here on purpose — there's no real account system
// yet, so we don't want to imply one by pre-filling a fake name or email.
const defaultProfile: UserProfile = {
  name: '',
  email: '',
  unit: 'kg',
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) }
  } catch {
    // ignore malformed storage
  }
  return defaultProfile
}

type ProfileContextValue = {
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile)

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  function updateProfile(patch: Partial<UserProfile>) {
    setProfile((prev) => ({ ...prev, ...patch }))
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return ctx
}
