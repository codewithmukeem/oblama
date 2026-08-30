import { ArrowDownToLine, ArrowLeft, Check, Heart, ShieldCheck } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getDownloadableFiles, getHuggingFaceModel, getHuggingFaceToken, modelToCatalog } from '@/src/services/huggingface';
import { downloadModel } from '@/src/services/modelDownloader';
import { notifyDownloadComplete } from '@/src/services/notifications';
import { useAppStore } from '@/src/store/appStore';

export default function ModelDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: encodedId } = useLocalSearchParams<{ id: string }>();
  const modelId = decodeURIComponent(encodedId ?? '');
  const [model, setModel] = useState<Awaited<ReturnType<typeof getHuggingFaceModel>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const addInstalledModel = useAppStore((state) => state.addInstalledModel);
  const installedModels = useAppStore((state) => state.installedModels);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getHuggingFaceToken();
        const details = await getHuggingFaceModel(modelId, token);
        if (active) {
          setModel(details);
          setSelectedFile(getDownloadableFiles(details)[0]?.rfilename);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load this model.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [modelId]);

  const files = useMemo(() => model ? getDownloadableFiles(model) : [], [model]);
  const selected = files.find((file) => file.rfilename === selectedFile) ?? files[0];
  const catalogModel = model && selected ? modelToCatalog(model, selected) : null;
  const alreadyInstalled = catalogModel ? installedModels.some((item) => item.id === catalogModel.id && item.status === 'ready') : false;

  const download = async () => {
    if (!catalogModel || downloading) return;
    setDownloading(true);
    const token = await getHuggingFaceToken();
    const withAuth = { ...catalogModel, downloadHeaders: token ? { Authorization: `Bearer ${token}` } : undefined };
    addInstalledModel({ id: withAuth.id, name: withAuth.name, task: withAuth.task, format: withAuth.format, sizeBytes: withAuth.estimatedBytes, sizeLabel: withAuth.sizeLabel, source: 'catalog', catalogId: withAuth.id, localUri: '', status: 'downloading' });
    try {
      const result = await downloadModel(withAuth, setProgress);
      addInstalledModel({ id: withAuth.id, name: withAuth.name, task: withAuth.task, format: withAuth.format, sizeBytes: result.sizeBytes, sizeLabel: withAuth.sizeLabel, source: 'catalog', catalogId: withAuth.id, localUri: result.localUri, status: 'ready' });
      await notifyDownloadComplete(withAuth.name);
      Alert.alert('Model ready', `${withAuth.name} is ready to use on this device.`);
    } catch (cause) {
      Alert.alert('Download failed', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back"><ArrowLeft size={21} color={colors.foreground} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Model details</Text>
        <View style={{ width: 21 }} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.muted, { color: colors.mutedForeground }]}>Loading from Hugging Face…</Text></View> : error ? <View style={styles.center}><ShieldCheck size={28} color={colors.primary} /><Text style={[styles.errorTitle, { color: colors.foreground }]}>Couldn’t load model</Text><Text style={[styles.muted, { color: colors.mutedForeground }]}>{error}</Text></View> : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><ShieldCheck size={24} color={colors.primary} /></View>
            <Text style={[styles.title, { color: colors.foreground }]}>{model?.id.split('/').pop()}</Text>
            <Text style={[styles.publisher, { color: colors.mutedForeground }]}>{model?.author ?? model?.id}</Text>
            <View style={styles.stats}><Text style={[styles.stat, { color: colors.mutedForeground }]}>{(model?.downloads ?? 0).toLocaleString()} downloads</Text><Text style={[styles.stat, { color: colors.mutedForeground }]}>{(model?.likes ?? 0).toLocaleString()} likes</Text>{model?.cardData?.license ? <Text style={[styles.stat, { color: colors.mutedForeground }]}>{model.cardData.license}</Text> : null}</View>
          </View>
          <View style={[styles.notice, { backgroundColor: colors.accent }]}><ShieldCheck size={17} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.accentForeground }]}>{model?.gated ? 'This is a gated model. Add a Hugging Face token in Settings before downloading.' : 'Downloads are direct from Hugging Face and stay on your device.'}</Text></View>
          <Text style={[styles.section, { color: colors.foreground }]}>Downloadable files</Text>
          {files.length === 0 ? <Text style={[styles.muted, { color: colors.mutedForeground }]}>No GGUF or ONNX files were found in this repository.</Text> : files.map((file) => {
            const selectedFileRow = selected?.rfilename === file.rfilename;
            const bytes = file.lfs?.size ?? file.size ?? 0;
            return <Pressable key={file.rfilename} onPress={() => setSelectedFile(file.rfilename)} style={[styles.fileRow, { backgroundColor: colors.card, borderColor: selectedFileRow ? colors.primary : colors.border }]}><View style={styles.fileText}><Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={2}>{file.rfilename}</Text><Text style={[styles.muted, { color: colors.mutedForeground }]}>{bytes ? `${(bytes / 1024 ** 3).toFixed(2)} GB` : 'Size unknown'} · {file.lfs?.sha256 ? 'SHA-256 available' : 'Integrity check after download'}</Text></View>{selectedFileRow ? <Check size={18} color={colors.primary} /> : null}</Pressable>;
          })}
          {catalogModel ? <Pressable onPress={() => void download()} disabled={downloading || alreadyInstalled} style={[styles.download, { backgroundColor: colors.primary, opacity: downloading ? 0.7 : 1 }]}>{downloading ? <><ActivityIndicator color={colors.primaryForeground} /><Text style={[styles.downloadText, { color: colors.primaryForeground }]}>Downloading {Math.round(progress * 100)}%</Text></> : alreadyInstalled ? <><Check size={18} color={colors.primaryForeground} /><Text style={[styles.downloadText, { color: colors.primaryForeground }]}>Installed</Text></> : <><ArrowDownToLine size={18} color={colors.primaryForeground} /><Text style={[styles.downloadText, { color: colors.primaryForeground }]}>Download to device</Text></>}</Pressable> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 58, paddingHorizontal: 18, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  hero: { padding: 22, gap: 7 },
  icon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7 },
  publisher: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 7 },
  stat: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  notice: { marginHorizontal: 20, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  section: { marginHorizontal: 20, marginTop: 26, marginBottom: 10, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  fileRow: { marginHorizontal: 20, marginBottom: 9, padding: 13, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileText: { flex: 1, gap: 5 },
  fileName: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  muted: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  download: { margin: 20, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  downloadText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
  errorTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
});