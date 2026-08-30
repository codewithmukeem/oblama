import { NativeModules } from 'react-native';
export interface LocalChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NativeLlamaModule {
  streamChat(args: {
    modelUri: string;
    messages: Array<{ role: string; content: string }>;
    onToken: (token: string) => void;
  }): Promise<void>;
}

export async function streamLocalChat(
  modelUri: string,
  messages: LocalChatMessage[],
  onToken: (token: string) => void,
) {
  const runtime = NativeModules.OblamaLlama as
    | NativeLlamaModule
    | undefined;
  if (!runtime) {
    throw new Error(
      'The local chat runtime is not available in this preview. Build the native app to run llama.cpp on-device.',
    );
  }
  await runtime.streamChat({
    modelUri,
    messages: messages.map(({ role, content }) => ({ role, content })),
    onToken,
  });
}