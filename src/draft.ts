import { router } from 'expo-router';
import { DEFAULT_AVATAR } from './content/avatars';
import { Profile, getProfile, saveProfile } from './storage';

/**
 * The profile being built across onboarding screens 04 → 08. It lives in memory until the learner
 * finishes, so going Back keeps their answers and nothing half-done is saved.
 */
export const draft: Partial<Profile> = {};

/** Load the saved profile into the draft (used when editing from Me). */
export async function loadDraft() {
  const p = await getProfile();
  if (p) Object.assign(draft, p);
}

/** Save the finished draft and enter the app on the map. */
export async function finishOnboarding() {
  await saveProfile({
    name: draft.name?.trim() || 'Student',
    avatar: draft.avatar ?? DEFAULT_AVATAR,
    university: draft.university?.trim() || undefined,
    year: draft.year,
    major: draft.major ?? 'Computer Science / IT',
    level: draft.level ?? 'B1',
    levelSource: draft.levelSource ?? 'manual',
    goals: draft.goals ?? [],
  });
  if (router.canDismiss()) router.dismissAll();
  router.replace('/map');
}
