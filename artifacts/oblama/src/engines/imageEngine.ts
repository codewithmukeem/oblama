import { NativeModules } from 'react-native';

interface NativeImageModule {
  generate(args: {
    modelUri: string;
    prompt: string;
    steps: number;
    width: number;
    height: number;
  }): Promise<{ uri: string }>;
}

export async function generateLocalImage(
  modelUri: string,
  prompt: string,
  steps: number,
  aspectRatio: 'square' | 'portrait' | 'landscape',
) {
  const runtime = NativeModules.OblamaImage as
    | NativeImageModule
    | undefined;
  if (!runtime) {
    throw new Error(
      'The local image runtime is not available in this preview. Build the native app to run ONNX inference on-device.',
    );
  }

  const dimensions =
    aspectRatio === 'portrait'
      ? { width: 640, height: 896 }
      : aspectRatio === 'landscape'
        ? { width: 896, height: 640 }
        : { width: 768, height: 768 };

  return runtime.generate({ modelUri, prompt, steps, ...dimensions });
}