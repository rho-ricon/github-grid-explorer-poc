import { Avatar } from '@base-ui/react/avatar';

export function GitHubAvatar({
  src,
  label,
  className,
  size,
}: {
  src: string;
  label: string;
  className: string;
  size: number;
}) {
  return (
    <Avatar.Root className={className} title={label}>
      <Avatar.Image className="avatarImage" src={githubAvatarUrl(src, size)} alt={label} draggable={false} />
      <Avatar.Fallback className="avatarFallback" delay={200}>
        {avatarFallbackText(label)}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

export function githubAvatarUrl(src: string, size: number) {
  try {
    const url = new URL(src);
    url.searchParams.set('s', String(size));
    return url.toString();
  } catch {
    return src;
  }
}

function avatarFallbackText(label: string) {
  return label
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
