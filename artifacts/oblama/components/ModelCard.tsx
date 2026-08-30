import { CheckCircle2, ChevronRight, Image as ImageIcon, MessageCircle, Pause, Play, X } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CatalogModel, InstalledModel } from '@/src/types/model';
import { ProgressBar } from '@/components/ProgressBar';

interface Props {
  model: CatalogModel;
  installed?: InstalledModel;
  recommended?: boolean;
  progress?: number;
  onPress: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function ModelCard({
  model,
  installed,
  recommended,
  progress,
  onPress,
  onPause,
  onResume,
  onCancel,
}: Props) {
  const colors = useColors();
  const isDownloading = installed?.status === 'downloading';
  const isReady = installed?.status === 'ready';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
      testID={`model-card-${model.id}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          {model.task === 'chat' ? <MessageCircle size={18} color={colors.primary} /> : <ImageIcon size={18} color={colors.primary} />}
        </View>
        <View style={styles.titleWrap}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {model.name}
            </Text>
            {recommended ? (
              <View style={[styles.recommended, { backgroundColor: colors.accent }]}>
                <Text style={[styles.recommendedText, { color: colors.accentForeground }]}>
                  Recommended
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.publisher, { color: colors.mutedForeground }]}>
            {model.publisher}
          </Text>
        </View>
        {isReady ? (
          <CheckCircle2 size={19} color={colors.primary} />
        ) : (
          <ChevronRight size={18} color={colors.mutedForeground} />
        )}
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {model.description}
      </Text>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.foreground }]}>
          {model.sizeLabel}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {model.parameterCount}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {model.quantization ?? model.format.toUpperCase()}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {model.recommendedRamMb / 1024} GB RAM+
        </Text>
      </View>

        {isDownloading && typeof progress === 'number' ? (
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} />
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                Downloading {Math.round(progress * 100)}%
              </Text>
              <View style={styles.progressActions}>
                <Pressable onPress={onPause} hitSlop={8}>
                  <Pause size={15} color={colors.foreground} />
                </Pressable>
                <Pressable onPress={onCancel} hitSlop={8}>
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
        </View>
      ) : null}
      {installed?.status === 'paused' ? (
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            Download paused
          </Text>
          <View style={styles.progressActions}>
            <Pressable onPress={onResume} hitSlop={8}>
              <Play size={15} color={colors.primary} />
            </Pressable>
            <Pressable onPress={onCancel} hitSlop={8}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  publisher: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  recommended: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  recommendedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  progressWrap: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});