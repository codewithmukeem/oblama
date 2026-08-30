import * as Device from 'expo-device';
import { CatalogModel } from '@/src/types/model';

export interface DeviceCapability {
  totalRamMb: number | null;
  label: string;
  comfortableRamMb: number;
}

export function getDeviceCapability(): DeviceCapability {
  const totalRamMb = Device.totalMemory
    ? Math.round(Device.totalMemory / 1024 / 1024)
    : null;

  if (!totalRamMb) {
    return {
      totalRamMb: null,
      label: 'Device memory unavailable',
      comfortableRamMb: 4096,
    };
  }

  const comfortableRamMb = Math.max(1024, Math.round(totalRamMb * 0.68));
  const label =
    totalRamMb < 4096
      ? 'Light device'
      : totalRamMb < 6144
        ? 'Everyday device'
        : totalRamMb < 8192
          ? 'Capable device'
          : 'High-memory device';

  return { totalRamMb, label, comfortableRamMb };
}

export function isComfortableModel(
  model: CatalogModel,
  capability: DeviceCapability,
) {
  return capability.totalRamMb === null
    ? model.minRamMb <= capability.comfortableRamMb
    : model.recommendedRamMb <= capability.totalRamMb;
}

export function rankCatalog(
  models: CatalogModel[],
  capability: DeviceCapability,
) {
  return [...models].sort((a, b) => {
    const aRecommended = isComfortableModel(a, capability) ? 1 : 0;
    const bRecommended = isComfortableModel(b, capability) ? 1 : 0;
    return bRecommended - aRecommended || a.estimatedBytes - b.estimatedBytes;
  });
}