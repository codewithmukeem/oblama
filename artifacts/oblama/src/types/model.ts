export type ModelTask = 'chat' | 'image';
export type ModelSource = 'catalog' | 'imported';
export type ModelStatus = 'ready' | 'downloading' | 'paused' | 'error';

export interface CatalogModel {
  id: string;
  name: string;
  publisher: string;
  task: ModelTask;
  format: 'gguf' | 'onnx';
  parameterCount: string;
  sizeLabel: string;
  estimatedBytes: number;
  minRamMb: number;
  recommendedRamMb: number;
  description: string;
  quantization?: string;
  downloadUrl: string;
  downloadHeaders?: Record<string, string>;
  license?: string;
  gated?: boolean;
  downloads?: number;
  likes?: number;
  sourceId?: string;
  accent: 'violet' | 'slate';
}

export interface InstalledModel {
  id: string;
  name: string;
  task: ModelTask;
  format: 'gguf' | 'onnx';
  sizeBytes: number;
  sizeLabel: string;
  source: ModelSource;
  catalogId?: string;
  localUri: string;
  status: ModelStatus;
  importedAt?: number;
}

export interface HuggingFaceFile {
  rfilename: string;
  size?: number;
  lfs?: { size?: number; sha256?: string };
  type?: string;
}

export interface HuggingFaceModel {
  id: string;
  author?: string;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  downloads?: number;
  likes?: number;
  lastModified?: string;
  private?: boolean;
  gated?: boolean | string;
  cardData?: { license?: string; language?: string[]; pipeline_tag?: string };
  siblings?: HuggingFaceFile[];
}