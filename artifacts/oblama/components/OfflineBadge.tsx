import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function OfflineBadge() {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
      <ShieldCheck size={12} color={colors.primary} />
      <Text style={[styles.label, { color: colors.secondaryForeground }]}>
        On-device
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});