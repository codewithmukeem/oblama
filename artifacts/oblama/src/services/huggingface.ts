import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CatalogModel,
  HuggingFaceFile,
  HuggingFaceModel,
} from '@/src/types/model';

const HF_API = 'https://huggingface.co/api';
const TOKEN_KEY = 'oblama-huggingface-token';
const SEARCH_CACHE_PREFIX = 'oblama:hf-search:';

export type SearchSort = 'downloads' | 'likes' | 'lastModified';

function headers(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getHuggingFaceToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveHuggingFaceToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token.trim());
}

export async function clearHuggingFaceToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function searchHuggingFaceModels(
  query: string,
  options: {
    task?: 'text-generation' | 'text-to-image';
    library?: string;
    sort?: SearchSort;
    token?: string | null;
  } = {},
) {
  const params = new URLSearchParams({
    search: query.trim(),
    filter: options.task ?? '',
    sort: options.sort ?? 'downloads',
    direction: '-1',
    limit: '30',
    full: 'true',
  });
  if (options.library) params.set('library', options.library);
  const response = await fetch(`${HF_API}/models?${params.toString()}`, {
    headers: headers(options.token ?? undefined),
  });
  if (!response.ok) throw new Error(`Hugging Face search failed (${response.status}).`);
  const results = (await response.json()) as HuggingFaceModel[];
  await AsyncStorage.setItem(
    `${SEARCH_CACHE_PREFIX}${query.trim().toLowerCase()}:${options.task ?? 'all'}:${options.library ?? 'all'}`,
    JSON.stringify({ savedAt: Date.now(), results }),
  );
  return results;
}

export async function getCachedHuggingFaceModels(query: string, task?: string) {
  const key = `${SEARCH_CACHE_PREFIX}${query.trim().toLowerCase()}:${task ?? 'all'}:all`;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw) as { savedAt: number; results: HuggingFaceModel[] };
    return Date.now() - cached.savedAt < 24 * 60 * 60 * 1000 ? cached.results : null;
  } catch {
    return null;
  }
}

export async function getHuggingFaceModel(modelId: string, token?: string | null) {
  const response = await fetch(`${HF_API}/models/${modelId}`, {
    headers: headers(token ?? undefined),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('This model requires a valid Hugging Face token.');
    }
    throw new Error(`Could not load model details (${response.status}).`);
  }
  return (await response.json()) as HuggingFaceModel;
}

export function modelToCatalog(model: HuggingFaceModel, file: HuggingFaceFile): CatalogModel {
  const isImage = model.pipeline_tag === 'text-to-image' || model.tags?.includes('text-to-image');
  const task = isImage ? 'image' : 'chat';
  const format = file.rfilename.toLowerCase().endsWith('.onnx') ? 'onnx' : 'gguf';
  const bytes = file.lfs?.size ?? file.size ?? 0;
  const sizeLabel = bytes > 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
  return {
    id: `${model.id}:${file.rfilename}`,
    sourceId: model.id,
    name: model.id.split('/').pop() ?? model.id,
    publisher: model.author ?? model.id.split('/')[0] ?? 'Hugging Face',
    task,
    format,
    parameterCount: 'Open model',
    sizeLabel,
    estimatedBytes: bytes,
    minRamMb: task === 'image' ? 6144 : 2048,
    recommendedRamMb: task === 'image' ? 8192 : 4096,
    description: `${model.pipeline_tag ?? 'Open-source'} model from Hugging Face.`,
    quantization: file.rfilename.match(/(Q[0-9][^./]*)/i)?.[1],
    downloadUrl: `https://huggingface.co/${model.id}/resolve/main/${file.rfilename}`,
    license: model.cardData?.license,
    gated: Boolean(model.gated && model.gated !== 'false'),
    downloads: model.downloads,
    likes: model.likes,
    accent: task === 'image' ? 'violet' : 'slate',
  };
}

export function getDownloadableFiles(model: HuggingFaceModel) {
  return (model.siblings ?? []).filter((file) => /\.(gguf|onnx)$/i.test(file.rfilename));
}