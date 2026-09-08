// On-device replacement for POST /api/users / GET /api/user/:id.
// The profile is the only "server row" this app has — it lives in
// AsyncStorage and targets are recomputed from it on the fly.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoalTargets } from '../engines/trackingEngine';
import { GoalTargets, UserProfile } from '../types';

const PROFILE_KEY = 'adapt_user_profile';

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  async clearProfile(): Promise<void> {
    await AsyncStorage.removeItem(PROFILE_KEY);
  },

  async getTargets(): Promise<GoalTargets | null> {
    const profile = await profileService.getProfile();
    if (!profile) return null;
    return getGoalTargets(profile);
  },
};
