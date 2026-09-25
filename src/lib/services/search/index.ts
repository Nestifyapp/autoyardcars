import 'server-only';
import { firestoreSearchProvider } from './firestore-provider';
import type { SearchProvider } from './types';

/** Provider registry. Add Algolia/Typesense here; nothing else changes. */
const providers: Record<string, () => SearchProvider> = {
  firestore: () => firestoreSearchProvider,
};

export function getSearchProvider(): SearchProvider {
  const key = process.env.SEARCH_PROVIDER ?? 'firestore';
  const factory = providers[key];
  if (!factory) {
    console.warn(`[search] Unknown SEARCH_PROVIDER "${key}" — falling back to firestore.`);
    return firestoreSearchProvider;
  }
  return factory();
}
export * from './types';
