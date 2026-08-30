import * as MediaLibrary from 'expo-media-library';
import { Aperture, Check, CheckCircle2, Download, Image as ImageIcon, Layers, LoaderCircle, Monitor, Smartphone, Square, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { generateLocalImage } from '@/src/engines/imageEngine';
import { useAppStore } from '@/src/store/appStore';

export default function ImageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState(4);
  const [aspectRatio, setAspectRatio] = useState<'square' | 'portrait' | 'landscape'>('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const installedModels = useAppStore((state) => state.installedModels);
  const imageModel = useMemo(
    () => installedModels.find((model) => model.task === 'image' && model.status === 'ready'),
    [installedModels],
  );

  const handleGenerate = async () => {
    if (!imageModel || !prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateLocalImage(imageModel.localUri, prompt.trim(), steps, aspectRatio);
      setGeneratedUri(result.uri);
    } catch (error) {
      Alert.alert('Local generation unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveImage = async () => {
    if (!generatedUri) return;
    if (!MediaLibrary.isAvailableAsync) return;
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos permission needed', 'Allow photo access to save generated images to your gallery.');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(generatedUri);
    Alert.alert('Saved', 'Your image was saved to the device gallery.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={[styles.kicker, { color: colors.primary }]}>LOCAL STUDIO</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Images</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Turn a thought into an image, without sending your prompt anywhere.</Text>
          </View>
          <ImageIcon size={21} color={colors.foreground} />
        </View>

        {!imageModel ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Layers size={21} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Add an image model first</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Download SD Turbo from Models to unlock private, on-device image generation.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.modelPill, { backgroundColor: colors.secondary }]}>
              <CheckCircle2 size={14} color={colors.primary} />
              <Text style={[styles.modelPillText, { color: colors.secondaryForeground }]}>{imageModel.name} ready</Text>
            </View>
            <View style={[styles.canvas, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {generatedUri ? (
                <View style={styles.generatedPreview}>
                  <Image source={{ uri: generatedUri }} style={styles.generatedImage} resizeMode="cover" />
                  <View style={[styles.previewLabel, { backgroundColor: colors.card }]}>
                    <Check size={14} color={colors.primary} />
                    <Text style={[styles.previewText, { color: colors.foreground }]}>Generated on device</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Aperture size={30} color={colors.mutedForeground} />
                  <Text style={[styles.canvasTitle, { color: colors.foreground }]}>Your canvas is ready</Text>
                  <Text style={[styles.canvasBody, { color: colors.mutedForeground }]}>Describe what you want to see below.</Text>
                </>
              )}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Prompt</Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="A quiet cabin beside a misty lake at dawn"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.promptInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              testID="image-prompt-input"
            />
            <View style={styles.controlsHeader}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Aspect ratio</Text>
              <Text style={[styles.stepsLabel, { color: colors.mutedForeground }]}>{steps} steps</Text>
            </View>
            <View style={styles.ratioRow}>
              {(['square', 'portrait', 'landscape'] as const).map((ratio) => (
                <Pressable
                  key={ratio}
                  onPress={() => setAspectRatio(ratio)}
                  style={[styles.ratio, { borderColor: aspectRatio === ratio ? colors.primary : colors.border, backgroundColor: aspectRatio === ratio ? colors.accent : colors.card }]}
                >
                  {ratio === 'square' ? <Square size={16} color={aspectRatio === ratio ? colors.primary : colors.mutedForeground} /> : ratio === 'portrait' ? <Smartphone size={16} color={aspectRatio === ratio ? colors.primary : colors.mutedForeground} /> : <Monitor size={16} color={aspectRatio === ratio ? colors.primary : colors.mutedForeground} />}
                  <Text style={[styles.ratioText, { color: aspectRatio === ratio ? colors.accentForeground : colors.mutedForeground }]}>{ratio[0].toUpperCase() + ratio.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.stepRow}>
              {[2, 4, 8].map((value) => (
                <Pressable key={value} onPress={() => setSteps(value)} style={[styles.step, { backgroundColor: steps === value ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.stepText, { color: steps === value ? colors.primaryForeground : colors.secondaryForeground }]}>{value}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => void handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              style={({ pressed }) => [styles.generateButton, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : isGenerating || !prompt.trim() ? 0.55 : 1 }]}
              testID="generate-image-button"
            >
              {isGenerating ? <LoaderCircle size={17} color={colors.primaryForeground} /> : <Zap size={17} color={colors.primaryForeground} />}
              <Text style={[styles.generateText, { color: colors.primaryForeground }]}>{isGenerating ? 'Generating locally…' : 'Generate on device'}</Text>
            </Pressable>
            {generatedUri ? (
              <Pressable onPress={() => void saveImage()} style={styles.saveButton}>
                <Download size={16} color={colors.primary} />
                <Text style={[styles.saveText, { color: colors.primary }]}>Save to gallery</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: { gap: 5, flex: 1 },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, maxWidth: 300 },
  emptyCard: {
    margin: 20,
    marginTop: 26,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  modelPill: { marginHorizontal: 20, marginTop: 22, alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  modelPillText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  canvas: { margin: 20, marginBottom: 22, aspectRatio: 1, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 9, overflow: 'hidden' },
  canvasTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  canvasBody: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  generatedPreview: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10 },
  generatedImage: { width: '100%', height: '100%' },
  previewLabel: { position: 'absolute', bottom: 14, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  fieldLabel: { marginHorizontal: 20, fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8 },
  promptInput: { minHeight: 92, marginHorizontal: 20, borderWidth: 1, borderRadius: 14, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlignVertical: 'top' },
  controlsHeader: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepsLabel: { marginRight: 20, fontFamily: 'Inter_400Regular', fontSize: 12 },
  ratioRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  ratio: { flex: 1, minHeight: 58, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 5 },
  ratioText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  stepRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 12 },
  step: { width: 42, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  generateButton: { marginHorizontal: 20, marginTop: 22, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  generateText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  saveButton: { alignSelf: 'center', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});