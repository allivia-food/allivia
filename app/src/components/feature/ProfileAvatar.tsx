import { useEffect, useState } from 'react';
import { AppState, Image, View } from 'react-native';
import { Icon, IconBadge } from '@/components/ui';
import { avatarUrl } from '@/services/avatar';
export function ProfileAvatar({
  path,
  preview,
  size,
}: {
  path?: string | null;
  preview?: string | null;
  size?: number;
}) {
  const [loaded, setLoaded] = useState<{ path: string; url: string } | null>(null);
  const url = loaded?.path === path ? loaded?.url : null;
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (path)
        void avatarUrl(path)
          .then((value) => {
            if (active) setLoaded({ path, url: value });
          })
          .catch(() => {
            if (active) setLoaded(null);
          });
    };
    refresh();
    const timer = setInterval(refresh, 3000000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      listener.remove();
    };
  }, [path]);
  return preview || url ? (
    <Image
      accessibilityLabel="Foto de perfil"
      source={{ uri: preview || url! }}
      style={{ width: size ?? 72, height: size ?? 72, borderRadius: (size ?? 72) / 2 }}
      onError={() => setLoaded(null)}
    />
  ) : size ? (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Foto de perfil"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="user" size={size * 0.6} />
    </View>
  ) : (
    <IconBadge icon="user" size="medium" accessibilityLabel="Foto de perfil" />
  );
}
