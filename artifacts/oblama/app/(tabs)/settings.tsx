import { useRouter } from 'expo-router';
import { Check, ChevronRight, Cpu, HardDrive, KeyRound, Lock, Moon, Save, Sun, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OfflineBadge } from '@/components/OfflineBadge';
import { useAppStore } from '@/src/store/appStore';
import { clearHuggingFaceToken, getHuggingFaceToken, saveHuggingFaceToken } from '@/src/services/huggingface';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const installedModels = useAppStore((state) => state.installedModels);
  const storageUsed = installedModels.reduce((sum, model) => sum + model.sizeBytes, 0);
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    void getHuggingFaceToken().then((value) => setHasToken(Boolean(value)));
  }, []);

  const saveToken = async () => {
    if (!token.trim()) return;
    await saveHuggingFaceToken(token);
    setToken('');
    setHasToken(true);
    setShowTokenModal(false);
    Alert.alert('Token saved', 'Your Hugging Face token is stored securely on this device.');
  };

  const removeToken = () => {
    Alert.alert('Remove Hugging Face token?', 'Gated model downloads will need authorization again.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { void clearHuggingFaceToken(); setHasToken(false); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={[styles.kicker, { color: colors.primary }]}>PREFERENCES</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your data stays yours. No account, no analytics, no cloud sync.</Text>
          </View>
          <OfflineBadge />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              {themeMode === 'dark' ? <Moon size={16} color={colors.primary} /> : <Sun size={16} color={colors.primary} />}
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Theme</Text>
              <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>Follow system appearance by default</Text>
            </View>
          </View>
          <View style={styles.themeRow}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <Pressable key={mode} onPress={() => setThemeMode(mode)} style={[styles.themeOption, { backgroundColor: themeMode === mode ? colors.primary : colors.secondary }]}>
                <Text style={[styles.themeText, { color: themeMode === mode ? colors.primaryForeground : colors.secondaryForeground }]}>{mode[0].toUpperCase() + mode.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Storage</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <HardDrive size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Downloaded models</Text>
              <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{installedModels.length} installed · {(storageUsed / 1024 / 1024 / 1024).toFixed(1)} GB used</Text>
            </View>
            <Pressable onPress={() => router.push('/models')} hitSlop={10}>
              <ChevronRight size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Model access</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><KeyRound size={16} color={colors.primary} /></View>
            <View style={styles.rowText}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Hugging Face token</Text><Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{hasToken ? 'Secure token saved on this device' : 'Optional · required for gated models'}</Text></View>
            {hasToken ? <Pressable onPress={removeToken} hitSlop={10} accessibilityLabel="Remove Hugging Face token"><X size={17} color={colors.mutedForeground} /></Pressable> : null}
          </View>
          <Pressable onPress={() => setShowTokenModal(true)} style={[styles.tokenButton, { backgroundColor: colors.secondary }]}><KeyRound size={15} color={colors.primary} /><Text style={[styles.tokenButtonText, { color: colors.secondaryForeground }]}>{hasToken ? 'Replace token' : 'Add token'}</Text></Pressable>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Oblama never sends your token anywhere except Hugging Face requests you initiate.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutTop}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
              <Cpu size={18} color={colors.primaryForeground} />
            </View>
            <View style={styles.aboutText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Oblama</Text>
              <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            </View>
          </View>
          <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.credit, { color: colors.mutedForeground }]}>Made by Mukeem Javaid</Text>
          <View style={styles.privacyRow}>
            <Lock size={14} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.foreground }]}>Your prompts and files never leave this device.</Text>
          </View>
        </View>
      </ScrollView>
      <Modal visible={showTokenModal} transparent animationType="slide" onRequestClose={() => setShowTokenModal(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Hugging Face token</Text><Pressable onPress={() => setShowTokenModal(false)} hitSlop={10}><X size={20} color={colors.mutedForeground} /></Pressable></View>
          <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>Add a read token from huggingface.co/settings/tokens to download gated repositories. It stays in the device secure store.</Text>
          <TextInput value={token} onChangeText={setToken} placeholder="hf_…" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.tokenInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} accessibilityLabel="Hugging Face token input" />
          <Pressable onPress={() => void saveToken()} disabled={!token.trim()} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: token.trim() ? 1 : 0.5 }]}><Save size={16} color={colors.primaryForeground} /><Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save securely</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleGroup: { gap: 5, flex: 1 },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, maxWidth: 300 },
  sectionTitle: { marginHorizontal: 20, marginTop: 28, marginBottom: 11, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  card: { marginHorizontal: 20, borderWidth: 1, borderRadius: 16, padding: 15, gap: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  rowBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, borderRadius: 9, paddingVertical: 9, alignItems: 'center' },
  themeText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  aboutTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aboutText: { gap: 4 },
  aboutDivider: { height: 1 },
  credit: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyText: { fontFamily: 'Inter_500Medium', fontSize: 11, flex: 1 },
  tokenButton: { minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  tokenButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modal: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  modalBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  tokenInput: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 14 },
  saveButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});