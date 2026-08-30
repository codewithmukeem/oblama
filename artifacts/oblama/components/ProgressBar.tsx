import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function ProgressBar({ progress }: { progress: number }) {
  const colors = useColors();
  return (
    <View style={[styles.track, { backgroundColor: colors.secondary }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});