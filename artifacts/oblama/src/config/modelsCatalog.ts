import { CatalogModel } from '@/src/types/model';

export const modelsCatalog: CatalogModel[] = [
  {
    id: 'tinyllama-11b-q4',
    name: 'TinyLlama Chat',
    publisher: 'TinyLlama',
    task: 'chat',
    format: 'gguf',
    parameterCount: '1.1B',
    sizeLabel: '638 MB',
    estimatedBytes: 638 * 1024 * 1024,
    minRamMb: 2048,
    recommendedRamMb: 4096,
    description: 'Fast, compact conversations for everyday questions.',
    quantization: 'Q4_K_M',
    downloadUrl:
      'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    accent: 'violet',
  },
  {
    id: 'phi-3-mini-q4',
    name: 'Phi-3 Mini',
    publisher: 'Microsoft',
    task: 'chat',
    format: 'gguf',
    parameterCount: '3.8B',
    sizeLabel: '2.2 GB',
    estimatedBytes: 2.2 * 1024 * 1024 * 1024,
    minRamMb: 4096,
    recommendedRamMb: 6144,
    description: 'A capable small model with strong reasoning for its size.',
    quantization: 'Q4_K_M',
    downloadUrl:
      'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    accent: 'slate',
  },
  {
    id: 'mistral-7b-q4',
    name: 'Mistral 7B Instruct',
    publisher: 'Mistral AI',
    task: 'chat',
    format: 'gguf',
    parameterCount: '7B',
    sizeLabel: '4.1 GB',
    estimatedBytes: 4.1 * 1024 * 1024 * 1024,
    minRamMb: 6144,
    recommendedRamMb: 8192,
    description: 'A richer local assistant for long-form writing and analysis.',
    quantization: 'Q4_K_M',
    downloadUrl:
      'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    accent: 'slate',
  },
  {
    id: 'sd-turbo-onnx',
    name: 'SD Turbo',
    publisher: 'Stability AI',
    task: 'image',
    format: 'onnx',
    parameterCount: '1B',
    sizeLabel: '1.7 GB',
    estimatedBytes: 1.7 * 1024 * 1024 * 1024,
    minRamMb: 6144,
    recommendedRamMb: 8192,
    description: 'Quick text-to-image generation in just a few steps.',
    quantization: 'INT8',
    downloadUrl:
      'https://huggingface.co/onnx-community/sd-turbo-ONNX/resolve/main/onnx/unet/model.onnx',
    accent: 'violet',
  },
];

export function findCatalogModel(id: string) {
  return modelsCatalog.find((model) => model.id === id);
}