import { ArrowRight, Download, LockKeyhole, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/src/store/appStore';

const steps = [
  { icon: Download, title: 'Bring your models', body: 'Download a curated open model or import a GGUF/ONNX file you already own.' },
  { icon: LockKeyhole, title: 'Keep it private', body: 'Prompts, conversations, and generated images stay on this device.' },
  { icon: Sparkles, title: 'Create anywhere', body: 'Chat and create offline, without accounts, tracking, or cloud inference.' },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);

  const finish = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.brand}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}><Sparkles size={22} color={colors.primaryForeground} /></View>
        <Text style={[styles.wordmark, { color: colors.foreground }]}>oblama</Text>
      </View>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>PRIVATE BY DEFAULT</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>AI that stays with you.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A calm, capable home for open-source models running locally on your phone.</Text>
      </View>
      <View style={styles.steps}>
        {steps.map(({ icon: Icon, title, body }) => (
          <View key={title} style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: colors.secondary }]}><Icon size={18} color={colors.primary} /></View>
            <View style={styles.stepText}><Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{body}</Text></View>
          </View>
        ))}
      </View>
      <Pressable onPress={finish} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]} testID="onboarding-start-button" accessibilityLabel="Start using Oblama">
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Start exploring</Text>
        <ArrowRight size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={[styles.footer, { color: colors.mutedForeground }]}>No account required · works offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6 },
  hero: { gap: 10, marginTop: 20 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 38, lineHeight: 43, letterSpacing: -1.3, maxWidth: 330 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, maxWidth: 330 },
  steps: { gap: 20 },
  step: { flexDirection: 'row', gap: 13, alignItems: 'flex-start' },
  stepIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 4 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  stepBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  button: { minHeight: 52, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  footer: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
});