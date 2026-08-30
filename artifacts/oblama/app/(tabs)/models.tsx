import * as DocumentPicker from 'expo-document-picker';
import { Search, SlidersHorizontal, Upload, Smartphone, Check, FilePlus, ChevronRight, Image as ImageIcon, MessageCircle, CheckCircle2, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ModelCard } from '@/components/ModelCard';
import { modelsCatalog } from '@/src/config/modelsCatalog';
import {
  getDeviceCapability,
  isComfortableModel,
  rankCatalog,
} from '@/src/services/deviceCapability';
import { downloadModel } from '@/src/services/modelDownloader';
import {
  cancelModelDownload,
  pauseModelDownload,
  resumeModelDownload,
} from '@/src/services/modelDownloader';
import {
  copyImportedModel,
  getFileSize,
  importInstalledModel,
  removeModelFile,
} from '@/src/services/storage';
import { useAppStore } from '@/src/store/appStore';
import { ModelTask } from '@/src/types/model';
import { getCachedHuggingFaceModels, getHuggingFaceToken, searchHuggingFaceModels } from '@/src/services/huggingface';
import { notifyDownloadComplete } from '@/src/services/notifications';

interface ImportState {
  uri: string;
  fileName: string;
  extension: 'gguf' | 'onnx';
}

export default function ModelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const capability = useMemo(() => getDeviceCapability(), []);
  const [filter, setFilter] = useState<'all' | ModelTask>('all');
  const [query, setQuery] = useState('');
  const [searchTask, setSearchTask] = useState<'all' | 'text-generation' | 'text-to-image'>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchHuggingFaceModels>>>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [importState, setImportState] = useState<ImportState | null>(null);
  const [importName, setImportName] = useState('');
  const [importTask, setImportTask] = useState<ModelTask>('chat');
  const installedModels = useAppStore((state) => state.installedModels);
  const addInstalledModel = useAppStore((state) => state.addInstalledModel);
  const setActiveModel = useAppStore((state) => state.setActiveModel);
  const removeInstalledModel = useAppStore((state) => state.removeInstalledModel);

  const visibleModels = rankCatalog(
    modelsCatalog.filter((model) => filter === 'all' || model.task === filter),
    capability,
  );
  const recommended = visibleModels.filter((model) =>
    isComfortableModel(model, capability),
  );
  const totalStorage = installedModels.reduce((sum, model) => sum + model.sizeBytes, 0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    let active = true;
    const timeout = setTimeout(() => {
      void (async () => {
        const task = searchTask === 'all' ? undefined : searchTask;
        const cached = await getCachedHuggingFaceModels(trimmed, task);
        if (active && cached) setSearchResults(cached);
        setSearchLoading(true);
        try {
          const token = await getHuggingFaceToken();
          const results = await searchHuggingFaceModels(trimmed, { task, token });
          if (active) {
            setSearchResults(results);
            setSearchError('');
          }
        } catch (cause) {
          if (active && !cached) setSearchError(cause instanceof Error ? cause.message : 'Search is unavailable offline.');
        } finally {
          if (active) setSearchLoading(false);
        }
      })();
    }, 350);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, searchTask]);

  const handleDownload = async (modelId: string) => {
    const model = modelsCatalog.find((item) => item.id === modelId);
    if (!model) return;
    if (!isComfortableModel(model, capability)) {
      Alert.alert(
        'Large model',
        'This model is above the comfortable memory range for this device. It may be slow or close other apps while running.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Download anyway', onPress: () => void runDownload(model) },
        ],
      );
      return;
    }
    await runDownload(model);
  };

  const runDownload = async (model: (typeof modelsCatalog)[number]) => {
    const temporaryId = model.id;
    addInstalledModel({
      id: temporaryId,
      name: model.name,
      task: model.task,
      format: model.format,
      sizeBytes: model.estimatedBytes,
      sizeLabel: model.sizeLabel,
      source: 'catalog',
      catalogId: model.id,
      localUri: '',
      status: 'downloading',
    });
    try {
      const result = await downloadModel(model, (progress) =>
        setProgresses((state) => ({ ...state, [model.id]: progress })),
      );
      addInstalledModel({
        id: temporaryId,
        name: model.name,
        task: model.task,
        format: model.format,
        sizeBytes: result.sizeBytes,
        sizeLabel: model.sizeLabel,
        source: 'catalog',
        catalogId: model.id,
        localUri: result.localUri,
        status: 'ready',
      });
      setActiveModel(model.id);
      void notifyDownloadComplete(model.name);
    } catch (error) {
      removeInstalledModel(temporaryId);
      Alert.alert(
        'Download failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const pauseDownload = async (model: (typeof modelsCatalog)[number]) => {
    const paused = await pauseModelDownload(model.id);
    if (!paused) return;
    const current = installedModels.find((item) => item.id === model.id);
    if (current) addInstalledModel({ ...current, status: 'paused' });
  };

  const resumeDownload = async (model: (typeof modelsCatalog)[number]) => {
    const current = installedModels.find((item) => item.id === model.id);
    if (current) addInstalledModel({ ...current, status: 'downloading' });
    try {
      const result = await resumeModelDownload(model.id, model, (progress) =>
        setProgresses((state) => ({ ...state, [model.id]: progress })),
      );
      addInstalledModel({
        id: model.id,
        name: model.name,
        task: model.task,
        format: model.format,
        sizeBytes: result.sizeBytes,
        sizeLabel: model.sizeLabel,
        source: 'catalog',
        catalogId: model.id,
        localUri: result.localUri,
        status: 'ready',
      });
      setActiveModel(model.id);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const cancelDownload = (modelId: string) => {
    cancelModelDownload(modelId);
    removeInstalledModel(modelId);
    setProgresses((state) => {
      const next = { ...state };
      delete next[modelId];
      return next;
    });
  };

  const deleteInstalledModel = (model: (typeof installedModels)[number]) => {
    Alert.alert(
      'Delete model?',
      `Remove ${model.name} from this device to free up ${model.sizeLabel}.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeModelFile(model.localUri);
            removeInstalledModel(model.id);
          },
        },
      ],
    );
  };

  const handlePickImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/octet-stream', 'application/onnx', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const lowerName = asset.name.toLowerCase();
    const extension = lowerName.endsWith('.onnx')
      ? 'onnx'
      : lowerName.endsWith('.gguf')
        ? 'gguf'
        : null;
    if (!extension) {
      Alert.alert('Unsupported file', 'Choose a .gguf chat model or .onnx image model.');
      return;
    }
    setImportState({ uri: asset.uri, fileName: asset.name, extension });
    setImportName(asset.name.replace(/\.(gguf|onnx)$/i, ''));
    setImportTask(extension === 'onnx' ? 'image' : 'chat');
  };

  const finishImport = async () => {
    if (!importState || !importName.trim()) return;
    try {
      const id = `imported-${Date.now()}`;
      const localUri = await copyImportedModel(
        importState.uri,
        id,
        importState.extension,
      );
      const sizeBytes = await getFileSize(localUri);
      const imported = {
        id,
        name: importName.trim(),
        task: importTask,
        format: importState.extension,
        sizeBytes,
        sizeLabel: `${(sizeBytes / 1024 / 1024).toFixed(0)} MB`,
        source: 'imported' as const,
        localUri,
        status: 'ready' as const,
        importedAt: Date.now(),
      };
      await importInstalledModel(imported);
      addInstalledModel(imported);
      setActiveModel(id);
      setImportState(null);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={[styles.kicker, { color: colors.primary }]}>MODEL LIBRARY</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Models</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Vetted open-source models that run on your device.
            </Text>
          </View>
          <Pressable onPress={handlePickImport} style={({ pressed }) => [{ opacity: pressed ? 0.55 : 1 }]}>
            <Upload size={21} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Hugging Face models"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            accessibilityLabel="Search Hugging Face models"
            testID="model-search-input"
          />
          {searchLoading ? <SlidersHorizontal size={16} color={colors.primary} /> : null}
        </View>
        {query.trim() ? (
          <>
            <View style={styles.filterRow}>
              {(['all', 'text-generation', 'text-to-image'] as const).map((item) => (
                <Pressable key={item} onPress={() => setSearchTask(item)} style={[styles.filter, { backgroundColor: searchTask === item ? colors.primary : colors.secondary }]} accessibilityLabel={`Filter ${item}`}>
                  <Text style={[styles.filterText, { color: searchTask === item ? colors.primaryForeground : colors.secondaryForeground }]}>{item === 'all' ? 'All' : item === 'text-generation' ? 'Chat' : 'Image'}</Text>
                </Pressable>
              ))}
            </View>
            {searchError ? <Text style={[styles.searchError, { color: colors.destructive }]}>{searchError}</Text> : null}
            {searchResults.length > 0 ? (
              <View style={styles.searchResults}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hugging Face results</Text>
                {searchResults.slice(0, 12).map((result) => (
                  <Pressable key={result.id} onPress={() => router.push({ pathname: '/model/[id]', params: { id: encodeURIComponent(result.id) } })} style={[styles.searchResult, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.searchResultIcon, { backgroundColor: colors.secondary }]}>{result.pipeline_tag === 'text-to-image' ? <ImageIcon size={16} color={colors.primary} /> : <MessageCircle size={16} color={colors.primary} />}</View>
                    <View style={styles.searchResultText}><Text style={[styles.searchResultName, { color: colors.foreground }]} numberOfLines={1}>{result.id}</Text><Text style={[styles.searchResultMeta, { color: colors.mutedForeground }]}>{(result.downloads ?? 0).toLocaleString()} downloads · {result.library_name ?? result.pipeline_tag ?? 'Open model'}{result.gated ? ' · gated' : ''}</Text></View>
                    <ChevronRight size={17} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <View style={[styles.capabilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.capabilityIcon, { backgroundColor: colors.secondary }]}>
            <Smartphone size={17} color={colors.primary} />
          </View>
          <View style={styles.capabilityText}>
            <Text style={[styles.capabilityLabel, { color: colors.foreground }]}>
              {capability.label}
            </Text>
            <Text style={[styles.capabilityBody, { color: colors.mutedForeground }]}>
              {capability.totalRamMb ? `${(capability.totalRamMb / 1024).toFixed(1)} GB RAM detected` : 'RAM will be checked when a model starts'}
            </Text>
          </View>
          <Check size={17} color={colors.primary} />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'chat', 'image'] as const).map((item) => {
            const selected = filter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filter,
                  { backgroundColor: selected ? colors.primary : colors.secondary },
                ]}
              >
                <Text style={[styles.filterText, { color: selected ? colors.primaryForeground : colors.secondaryForeground }]}>
                  {item === 'all' ? 'All models' : item === 'chat' ? 'Chat' : 'Image'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recommended for you</Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>{recommended.length} models</Text>
        </View>
        <View style={styles.list}>
          {visibleModels.map((model) => {
            const installed = installedModels.find((item) => item.id === model.id);
            return (
              <ModelCard
                key={model.id}
                model={model}
                installed={installed}
                progress={progresses[model.id]}
                recommended={isComfortableModel(model, capability)}
                onPress={() => {
                  if (installed?.status === 'ready') setActiveModel(model.id);
                  else if (!installed || installed.status === 'error') void handleDownload(model.id);
                }}
                onPause={() => void pauseDownload(model)}
                onResume={() => void resumeDownload(model)}
                onCancel={() => cancelDownload(model.id)}
              />
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your models</Text>
          <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
            {(totalStorage / 1024 / 1024 / 1024).toFixed(1)} GB used
          </Text>
        </View>
        {installedModels.length === 0 ? (
          <Pressable
            onPress={handlePickImport}
            style={[styles.importCard, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <FilePlus size={18} color={colors.primary} />
            <View style={styles.importText}>
              <Text style={[styles.importTitle, { color: colors.foreground }]}>Import a model file</Text>
              <Text style={[styles.importBody, { color: colors.mutedForeground }]}>
                Pick a .gguf or .onnx file already on your phone.
              </Text>
            </View>
            <ChevronRight size={17} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <View style={[styles.installedList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {installedModels.map((model, index) => (
              <Pressable
                key={model.id}
                onPress={() => setActiveModel(model.id)}
                style={[styles.installedRow, index < installedModels.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.installedIcon, { backgroundColor: colors.secondary }]}>
                  {model.task === 'chat' ? <MessageCircle size={15} color={colors.primary} /> : <ImageIcon size={15} color={colors.primary} />}
                </View>
                <View style={styles.installedText}>
                  <Text style={[styles.installedName, { color: colors.foreground }]}>{model.name}</Text>
                  <Text style={[styles.installedMeta, { color: colors.mutedForeground }]}>{model.sizeLabel} · {model.source === 'imported' ? 'Imported' : 'Downloaded'}</Text>
                </View>
                <CheckCircle2 size={17} color={colors.primary} />
                <Pressable onPress={() => deleteInstalledModel(model)} hitSlop={10}>
                  <Trash2 size={16} color={colors.mutedForeground} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!importState} transparent animationType="slide" onRequestClose={() => setImportState(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Import model</Text>
              <Pressable onPress={() => setImportState(null)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.modalFile, { color: colors.mutedForeground }]}>{importState?.fileName}</Text>
            <TextInput
              value={importName}
              onChangeText={setImportName}
              placeholder="Display name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              autoFocus
            />
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>This file is for</Text>
            <View style={styles.taskRow}>
              {(['chat', 'image'] as const).map((task) => (
                <Pressable
                  key={task}
                  onPress={() => setImportTask(task)}
                  style={[styles.taskButton, { borderColor: importTask === task ? colors.primary : colors.border, backgroundColor: importTask === task ? colors.accent : colors.background }]}
                >
                  {task === 'chat' ? <MessageCircle size={16} color={importTask === task ? colors.primary : colors.mutedForeground} /> : <ImageIcon size={16} color={importTask === task ? colors.primary : colors.mutedForeground} />}
                  <Text style={[styles.taskText, { color: importTask === task ? colors.accentForeground : colors.mutedForeground }]}>{task === 'chat' ? 'Chat' : 'Image'}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => void finishImport()} style={[styles.importButton, { backgroundColor: colors.primary }]} testID="confirm-import-button">
              <Text style={[styles.importButtonText, { color: colors.primaryForeground }]}>Add to my models</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: {
    marginHorizontal: 20,
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  searchResults: { gap: 9, marginTop: 4 },
  searchError: { marginHorizontal: 20, marginTop: 9, fontFamily: 'Inter_400Regular', fontSize: 12 },
  searchResult: { marginHorizontal: 20, minHeight: 62, padding: 12, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchResultIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchResultText: { flex: 1, gap: 4 },
  searchResultName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  searchResultMeta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: { gap: 5, flex: 1 },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
  },
  capabilityCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  capabilityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityText: { flex: 1, gap: 3 },
  capabilityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  capabilityBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    gap: 8,
  },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  sectionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  list: { paddingHorizontal: 20, gap: 10 },
  importCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  importText: { flex: 1, gap: 4 },
  importTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  importBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  installedList: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  installedRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  installedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installedText: { flex: 1, gap: 4 },
  installedName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  installedMeta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  modal: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  modalFile: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  modalLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 3 },
  taskRow: { flexDirection: 'row', gap: 10 },
  taskButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  taskText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  importButton: {
    marginTop: 4,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  importButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});