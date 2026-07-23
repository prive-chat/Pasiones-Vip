export interface ProfileMetadata {
  age?: number;
  birthDate?: string;
  hair?: string;
  eyes?: string;
  service?: string;
  country?: string;
  province?: string;
  city?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  telegram?: string;
  whatsapp?: string;
  onlyfans?: string;
  facebook?: string;
  stripchat?: string;
  kick?: string;
  clapper?: string;
}

/**
 * Parses the user's bio to extract any structural PASIONES_METADATA stored as an HTML comment.
 * This is fully backward-compatible and standard safe.
 */
export function parseProfileBio(bio: string | null | undefined): { cleanBio: string; metadata: ProfileMetadata } {
  if (!bio) return { cleanBio: '', metadata: {} };
  
  const regex = /<!--PASIONES_METADATA:([\s\S]*?)-->/;
  const match = bio.match(regex);
  if (match && match[1]) {
    try {
      const metadata = JSON.parse(match[1]);
      const cleanBio = bio.replace(regex, '').trim();
      return { cleanBio, metadata };
    } catch (e) {
      console.error('Error parsing profile metadata from bio:', e);
    }
  }
  return { cleanBio: bio, metadata: {} };
}

/**
 * Appends or updates the PASIONES_METADATA JSON block inside an HTML comment in the bio string.
 */
export function serializeProfileBio(bio: string | null | undefined, metadata: ProfileMetadata): string {
  const currentBio = bio || '';
  const { cleanBio } = parseProfileBio(currentBio);
  const metadataStr = JSON.stringify(metadata);
  return `${cleanBio}\n\n<!--PASIONES_METADATA:${metadataStr}-->`.trim();
}
