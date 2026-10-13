import { useEffect, useState } from 'react';
import { getProfile } from './storage';

/** The learner's first name for story lines, or null while it is still loading. */
export function useLearnerName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    getProfile().then((p) => setName(p?.name ?? ''));
  }, []);
  return name;
}
