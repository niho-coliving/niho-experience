type ImageCopy = { url?: string; alt?: string | null } | null;
type HostCopy = { avatar?: ImageCopy; displayName?: string; bio?: string | null };

export function imageAlt(image: ImageCopy, fallback: string): string {
  const alt = image?.alt?.trim();
  return alt || fallback;
}

export function hostBio(host: HostCopy): string | null {
  const bio = host.bio?.trim();
  return bio || null;
}
