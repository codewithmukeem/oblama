import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function notifyDownloadComplete(modelName: string) {
  if (Platform.OS === 'web') return;
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Model ready',
      body: `${modelName} is ready to run on your device.`,
      data: { type: 'model-download' },
    },
    trigger: null,
  });
}