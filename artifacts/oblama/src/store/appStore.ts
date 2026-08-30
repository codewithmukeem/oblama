import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { InstalledModel } from '@/src/types/model';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId?: string;
  messages: ChatMessage[];
  updatedAt: number;
  systemPrompt?: string;
  personaId?: string;
}

let idCounter = 0;
function makeId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

interface AppState {
  installedModels: InstalledModel[];
  activeModelId?: string;
  conversations: Conversation[];
  themeMode: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  setInstalledModels: (models: InstalledModel[]) => void;
  addInstalledModel: (model: InstalledModel) => void;
  removeInstalledModel: (id: string) => void;
  setActiveModel: (id?: string) => void;
  createConversation: (modelId?: string) => string;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessageContent: (
    conversationId: string,
    messageId: string,
    content: string,
  ) => void;
  updateConversationMessages: (
    conversationId: string,
    messages: ChatMessage[],
  ) => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  setOnboardingComplete: (complete: boolean) => void;
  updateConversationSettings: (
    conversationId: string,
    settings: { systemPrompt?: string; personaId?: string },
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      installedModels: [],
      conversations: [],
      themeMode: 'system',
      hasCompletedOnboarding: false,
      setInstalledModels: (models) => set({ installedModels: models }),
      addInstalledModel: (model) =>
        set((state) => ({
          installedModels: [
            ...state.installedModels.filter((item) => item.id !== model.id),
            model,
          ],
          activeModelId: state.activeModelId ?? model.id,
        })),
      removeInstalledModel: (id) =>
        set((state) => ({
          installedModels: state.installedModels.filter(
            (model) => model.id !== id,
          ),
          activeModelId:
            state.activeModelId === id
              ? state.installedModels.find((model) => model.id !== id)?.id
              : state.activeModelId,
        })),
      setActiveModel: (id) => set({ activeModelId: id }),
      createConversation: (modelId) => {
        const id = makeId('chat');
        const conversation: Conversation = {
          id,
          title: 'New conversation',
          modelId: modelId ?? get().activeModelId,
          messages: [],
          updatedAt: Date.now(),
          personaId: 'balanced',
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }));
        return id;
      },
      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) return conversation;
            const isFirstUserMessage =
              conversation.messages.length === 0 && message.role === 'user';
            return {
              ...conversation,
              title: isFirstUserMessage
                ? message.content.slice(0, 34) || 'New conversation'
                : conversation.title,
              messages: [...conversation.messages, message],
              updatedAt: Date.now(),
            };
          }),
        })),
      updateMessageContent: (conversationId, messageId, content) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id !== conversationId
              ? conversation
              : {
                  ...conversation,
                  messages: conversation.messages.map((item) =>
                    item.id === messageId ? { ...item, content } : item,
                  ),
                  updatedAt: Date.now(),
                },
          ),
        })),
      updateConversationMessages: (conversationId, messages) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, messages, updatedAt: Date.now() }
              : conversation,
          ),
        })),
      setThemeMode: (themeMode) => set({ themeMode }),
      setOnboardingComplete: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      updateConversationSettings: (conversationId, settings) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, ...settings, updatedAt: Date.now() }
              : conversation,
          ),
        })),
    }),
    {
      name: 'oblama-local-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        installedModels: state.installedModels,
        activeModelId: state.activeModelId,
        conversations: state.conversations,
        themeMode: state.themeMode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);