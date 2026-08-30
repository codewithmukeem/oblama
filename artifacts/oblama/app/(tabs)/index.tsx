import { useRootNavigationState, useRouter } from 'expo-router';
import { Check, ChevronRight, Cpu, DownloadCloud, MessageSquare, Plus } from 'lucide-react-native';
import { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OfflineBadge } from '@/components/OfflineBadge';
import { useAppStore } from '@/src/store/appStore';

export default function ChatHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const installedModels = useAppStore((state) => state.installedModels);
  const activeModelId = useAppStore((state) => state.activeModelId);
  const conversations = useAppStore((state) => state.conversations);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const createConversation = useAppStore((state) => state.createConversation);
  const activeModel = installedModels.find((model) => model.id === activeModelId);

  useEffect(() => {
    if (hasCompletedOnboarding || !rootNavigationState?.key) return;
    const redirect = setTimeout(() => {
      router.replace('/onboarding');
    }, 0);
    return () => clearTimeout(redirect);
  }, [hasCompletedOnboarding, rootNavigationState?.key, router]);

  const startChat = () => {
    const id = createConversation(activeModelId);
    router.push({ pathname: '/chat/[id]', params: { id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View>
          <Text style={[styles.wordmark, { color: colors.foreground }]}>oblama</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Local intelligence, private by default.
          </Text>
        </View>
        <OfflineBadge />
      </View>

      <FlatList
        data={conversations.slice(0, 6)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
              <Cpu size={25} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              Your private AI space
            </Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
              Nothing leaves this phone. Download a model to start a conversation
              that works anywhere, even offline.
            </Text>
            {activeModel ? (
              <View style={[styles.activeModel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.activeModelText}>
                  <Text style={[styles.activeLabel, { color: colors.mutedForeground }]}>
                    Active model
                  </Text>
                  <Text style={[styles.activeName, { color: colors.foreground }]}>
                    {activeModel.name}
                  </Text>
                </View>
                <Check size={18} color={colors.primary} />
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/models')}
                style={({ pressed }) => [
                  styles.setupButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
                ]}
                testID="browse-models-button"
              >
                <DownloadCloud size={17} color={colors.primaryForeground} />
                <Text style={[styles.setupButtonText, { color: colors.primaryForeground }]}>
                  Browse models
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={startChat}
              disabled={!activeModel}
              style={({ pressed }) => [
                styles.newChatButton,
                {
                  backgroundColor: activeModel ? colors.primary : colors.secondary,
                  opacity: pressed ? 0.86 : activeModel ? 1 : 0.6,
                },
              ]}
              testID="new-chat-button"
            >
              <Plus size={18} color={activeModel ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.newChatText, { color: activeModel ? colors.primaryForeground : colors.mutedForeground }]}>
                New chat
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.conversationRow,
              { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View style={[styles.conversationIcon, { backgroundColor: colors.secondary }]}>
              <MessageSquare size={16} color={colors.primary} />
            </View>
            <View style={styles.conversationText}>
              <Text style={[styles.conversationTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.conversationMeta, { color: colors.mutedForeground }]}>
                {item.messages.length} {item.messages.length === 1 ? 'message' : 'messages'}
              </Text>
            </View>
            <ChevronRight size={17} color={colors.mutedForeground} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyHistory}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Your local chats will live here and stay on this device.
            </Text>
          </View>
        }
        scrollEnabled={conversations.length > 0 || installedModels.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  hero: {
    paddingTop: 28,
    paddingBottom: 30,
    gap: 14,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.8,
  },
  heroBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
  activeModel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  activeModelText: { gap: 4 },
  activeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  activeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  setupButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setupButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  newChatButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newChatText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  conversationRow: {
    minHeight: 68,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conversationIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationText: { flex: 1, gap: 4 },
  conversationTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  conversationMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  emptyHistory: { paddingTop: 10, gap: 5 },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
});