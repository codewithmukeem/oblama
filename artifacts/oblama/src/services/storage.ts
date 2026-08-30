import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { InstalledModel } from '@/src/types/model';

const modelDirectoryName = 'models';

export async function getModelsDirectory() {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('Local app storage is unavailable.');
  const directory = `${base}${modelDirectoryName}/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

export async function getModelFileUri(id: string, extension: string) {
  const directory = await getModelsDirectory();
  return `${directory}${id}.${extension}`;
}

export async function copyImportedModel(
  sourceUri: string,
  id: string,
  extension: string,
) {
  const destination = await getModelFileUri(id, extension);
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function removeModelFile(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function getFileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && 'size' in info && typeof info.size === 'number'
    ? info.size
    : 0;
}

export async function verifyModelFile(uri: string, expectedBytes?: number) {
  const size = await getFileSize(uri);
  if (size <= 0) throw new Error('The model file is empty.');
  if (expectedBytes && size < expectedBytes * 0.45) {
    throw new Error('The downloaded file is smaller than expected.');
  }
  return size;
}

export async function importInstalledModel(model: InstalledModel) {
  await AsyncStorage.setItem(
    `oblama:model:${model.id}`,
    JSON.stringify(model),
  );
}