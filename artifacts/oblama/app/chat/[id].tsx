import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ArrowLeft, Download, MessageCircle, Settings2, Shield, Send, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ChatBubble, TypingIndicator } from '@/components/ChatBubble';
import { streamLocalChat } from '@/src/engines/llmEngine';
import { ChatMessage, useAppStore } from '@/src/store/appStore';
import { getPersona, personas } from '@/src/config/personas';
import type { LocalChatMessage } from '@/src/engines/llmEngine';

let messageCounter = 0;
function makeMessageId() {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const conversations = useAppStore((state) => state.conversations);
  const installedModels = useAppStore((state) => state.installedModels);
  const addMessage = useAppStore((state) => state.addMessage);
  const updateMessageContent = useAppStore((state) => state.updateMessageContent);
  const updateConversationMessages = useAppStore((state) => state.updateConversationMessages);
  const updateConversationSettings = useAppStore((state) => state.updateConversationSettings);
  const conversation = conversations.find((item) => item.id === id);
  const model = installedModels.find((item) => item.id === conversation?.modelId);
  const persona = getPersona(conversation?.personaId);

  if (!conversation) return null;

  const generateResponse = async (history: ChatMessage[], userMessage: ChatMessage) => {
    setIsStreaming(true);
    setShowTyping(true);
    let assistantContent = '';
    const assistantId = makeMessageId();
    addMessage(conversation.id, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    });
    try {
      if (!model?.localUri) throw new Error('Choose a downloaded chat model before sending a message.');
      const promptMessages: LocalChatMessage[] = [
        ...(persona?.prompt || conversation.systemPrompt
          ? [{
              role: 'system' as const,
              content: [persona?.prompt, conversation.systemPrompt].filter(Boolean).join('\n\n'),
            }]
          : []),
        ...history.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: userMessage.content },
      ];
      await streamLocalChat(model.localUri, promptMessages, (token) => {
        assistantContent += token;
        updateMessageContent(conversation.id, assistantId, assistantContent);
        setShowTyping(false);
      });
    } catch (error) {
      setShowTyping(false);
      updateMessageContent(conversation.id, assistantId, error instanceof Error ? error.message : 'The local model could not respond.');
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    const history = [...conversation.messages];
    setDraft('');
    addMessage(conversation.id, userMessage);
    await generateResponse(history, userMessage);
  };

  const regenerateLastResponse = async () => {
    if (isStreaming) return;
    const lastUserIndex = [...conversation.messages]
      .map((message) => message.role)
      .lastIndexOf('user');
    if (lastUserIndex < 0) return;
    const userMessage = conversation.messages[lastUserIndex];
    const history = conversation.messages.slice(0, lastUserIndex);
    updateConversationMessages(conversation.id, history);
    addMessage(conversation.id, userMessage);
    await generateResponse(history, userMessage);
  };

  const usePromptStarter = (prompt: string) => {
    setDraft(prompt);
    inputRef.current?.focus();
  };

  const openSettings = () => {
    setSystemPrompt(conversation.systemPrompt ?? '');
    setShowSettings(true);
  };

  const saveSettings = () => {
    updateConversationSettings(conversation.id, { systemPrompt: systemPrompt.trim() || undefined });
    setShowSettings(false);
  };

  const exportChat = async () => {
    const body = conversation.messages.map((message) => `${message.role === 'user' ? 'You' : 'Oblama'}\n${message.content}`).join('\n\n');
    if (Sharing.isAvailableAsync && await Sharing.isAvailableAsync()) {
      const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}oblama-${conversation.id}.txt`;
      if (uri) {
        await FileSystem.writeAsStringAsync(uri, `Oblama · ${conversation.title}\n\n${body}`);
        await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: 'Export conversation' });
      }
    }
  };

  const messageData = [...conversation.messages].reverse();

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconButton}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{conversation.title}</Text>
          <Text style={[styles.headerMeta, { color: colors.mutedForeground }]}>{model?.name ?? 'No model selected'} · offline</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={exportChat} hitSlop={10} accessibilityLabel="Export conversation"><Download size={17} color={colors.foreground} /></Pressable>
          <Pressable onPress={openSettings} hitSlop={10} accessibilityLabel="Conversation settings"><Settings2 size={17} color={colors.foreground} /></Pressable>
          <Shield size={17} color={colors.primary} />
        </View>
      </View>
      <FlatList
        data={messageData}
        keyExtractor={(item) => item.id}
         renderItem={({ item, index }) => (
           <ChatBubble
             message={item}
             onRegenerate={item.role === 'assistant' && index === 0 ? () => void regenerateLastResponse() : undefined}
           />
         )}
        inverted={conversation.messages.length > 0}
        ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
        contentContainerStyle={conversation.messages.length === 0 ? styles.emptyList : styles.listContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEnabled={conversation.messages.length > 0}
      />
      {conversation.messages.length === 0 ? (
        <View style={styles.emptyIntro}>
          <MessageCircle size={24} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start a private conversation</Text>
           <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Every message is processed locally by your downloaded model.</Text>
           <View style={styles.promptRow}>
             {['Explain a topic simply', 'Plan my day', 'Write a quick draft'].map((prompt) => (
               <Pressable key={prompt} onPress={() => usePromptStarter(prompt)} style={[styles.promptChip, { backgroundColor: colors.secondary }]}>
                 <Text style={[styles.promptText, { color: colors.secondaryForeground }]}>{prompt}</Text>
               </Pressable>
             ))}
           </View>
        </View>
      ) : null}
      <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message your local model"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          multiline
          blurOnSubmit={false}
          onSubmitEditing={() => void sendMessage()}
          testID="chat-input"
        />
        <Pressable onPress={() => void sendMessage()} disabled={!draft.trim() || isStreaming} style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : !draft.trim() || isStreaming ? 0.5 : 1 }]} testID="send-message-button">
          <Send size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Conversation settings</Text><Pressable onPress={() => setShowSettings(false)} hitSlop={10}><X size={20} color={colors.mutedForeground} /></Pressable></View>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Persona</Text>
            <View style={styles.personaList}>
              {personas.map((item) => <Pressable key={item.id} onPress={() => updateConversationSettings(conversation.id, { personaId: item.id })} style={[styles.persona, { backgroundColor: conversation.personaId === item.id ? colors.accent : colors.background, borderColor: conversation.personaId === item.id ? colors.primary : colors.border }]}><View style={styles.personaText}><Text style={[styles.personaName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.personaDescription, { color: colors.mutedForeground }]}>{item.description}</Text></View></Pressable>)}
            </View>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Additional system prompt</Text>
            <TextInput value={systemPrompt} onChangeText={setSystemPrompt} placeholder="Optional instructions for this conversation" placeholderTextColor={colors.mutedForeground} multiline style={[styles.promptInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
            <Pressable onPress={saveSettings} style={[styles.saveButton, { backgroundColor: colors.primary }]}><Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save settings</Text></Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 57, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconButton: { width: 30, alignItems: 'flex-start' },
  headerText: { flex: 1, gap: 3 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  headerMeta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  listContent: { paddingTop: 14, paddingBottom: 14 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyIntro: { position: 'absolute', top: '40%', left: 35, right: 35, alignItems: 'center', gap: 9 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  input: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 11, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  sendButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modal: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  modalLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 6 },
  personaList: { gap: 7 },
  persona: { borderWidth: 1, borderRadius: 12, padding: 11 },
  personaText: { gap: 3 },
  personaName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  personaDescription: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  promptInput: { minHeight: 76, borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', fontSize: 13, textAlignVertical: 'top' },
  saveButton: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  promptRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 4 },
  promptChip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  promptText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});