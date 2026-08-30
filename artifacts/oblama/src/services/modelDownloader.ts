import * as FileSystem from 'expo-file-system/legacy';
import { CatalogModel } from '@/src/types/model';
import {
  getModelFileUri,
  verifyModelFile,
} from '@/src/services/storage';

type ProgressCallback = (progress: number) => void;

const activeDownloads = new Map<string, FileSystem.DownloadResumable>();
const pausedDownloads = new Map<string, FileSystem.DownloadPauseState>();

export async function downloadModel(
  model: CatalogModel,
  onProgress: ProgressCallback,
) {
  const localUri = await getModelFileUri(model.id, model.format);
  const resumable = FileSystem.createDownloadResumable(
    model.downloadUrl,
    localUri,
    { headers: model.downloadHeaders },
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const progress =
        totalBytesExpectedToWrite > 0
          ? totalBytesWritten / totalBytesExpectedToWrite
          : 0;
      onProgress(progress);
    },
  );
  activeDownloads.set(model.id, resumable);

  try {
    const result = await resumable.downloadAsync();
    if (!result?.uri) throw new Error('The model download did not complete.');
    const sizeBytes = await verifyModelFile(result.uri, model.estimatedBytes);
    onProgress(1);
    return { localUri: result.uri, sizeBytes };
  } finally {
    activeDownloads.delete(model.id);
  }
}

export async function pauseModelDownload(id: string) {
  const download = activeDownloads.get(id);
  if (!download) return false;
  const resumeData = await download.pauseAsync();
  pausedDownloads.set(id, resumeData);
  return true;
}

export function hasPausedModelDownload(id: string) {
  return pausedDownloads.has(id);
}

export async function resumeModelDownload(
  id: string,
  model: CatalogModel,
  onProgress: ProgressCallback,
) {
  const paused = pausedDownloads.get(id);
  if (!paused) return downloadModel(model, onProgress);
  const resumable = FileSystem.createDownloadResumable(
    paused.url,
    paused.fileUri,
    paused.options,
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress(
        totalBytesExpectedToWrite > 0
          ? totalBytesWritten / totalBytesExpectedToWrite
          : 0,
      );
    },
    paused.resumeData,
  );
  pausedDownloads.delete(id);
  activeDownloads.set(id, resumable);
  try {
    const result = await resumable.downloadAsync();
    if (!result?.uri) throw new Error('The model download did not complete.');
    const sizeBytes = await verifyModelFile(result.uri, model.estimatedBytes);
    onProgress(1);
    return { localUri: result.uri, sizeBytes };
  } finally {
    activeDownloads.delete(id);
  }
}

export function cancelModelDownload(id: string) {
  activeDownloads.delete(id);
  pausedDownloads.delete(id);
}