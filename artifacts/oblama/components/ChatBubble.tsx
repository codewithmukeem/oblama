import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { ChatMessage } from '@/src/store/appStore';

function renderMarkdown(content: string) {
  const parts = content.split(/```([\w+-]*)\n?([\s\S]*?)```/g);
  return parts.map((part, index) => {
    if (index % 3 === 2) return null;
    if (index % 3 === 1) return null;
    return part ? <Text key={`text-${index}`}>{part}</Text> : null;
  });
}

function CodeBlocks({ content, color, borderColor }: { content: string; color: string; borderColor: string }) {
  const matches = [...content.matchAll(/```([\w+-]*)\n?([\s\S]*?)```/g)];
  const [copied, setCopied] = useState<number | null>(null);
  if (matches.length === 0) return null;
  return (
    <View style={styles.codeStack}>
      {matches.map((match, index) => (
        <View key={`${match[1]}-${index}`} style={[styles.codeBlock, { borderColor }]}>
          <View style={styles.codeHeader}>
            <Text style={[styles.codeLanguage, { color }]}>{match[1] || 'code'}</Text>
            <Pressable
              accessibilityLabel="Copy code"
              onPress={async () => {
                await Clipboard.setStringAsync(match[2].trim());
                setCopied(index);
              }}
              hitSlop={8}
              style={styles.copyButton}
            >
              {copied === index ? <Check size={14} color={color} /> : <Copy size={14} color={color} />}
              <Text style={[styles.copyLabel, { color }]}>{copied === index ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          </View>
          <Text selectable style={[styles.codeText, { color }]}>{match[2].trim()}</Text>
        </View>
      ))}
    </View>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
}

export function ChatBubble({ message, onRegenerate }: ChatBubbleProps) {
  const colors = useColors();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Animated.View entering={FadeInUp.duration(220)} style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {isUser ? message.content : renderMarkdown(message.content)}
        </Text>
        {!isUser ? <CodeBlocks content={message.content} color={colors.foreground} borderColor={colors.border} /> : null}
        {!isUser ? (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityLabel="Copy response"
              onPress={() => void copyMessage()}
              hitSlop={8}
              style={styles.actionButton}
            >
              {copied ? <Check size={13} color={colors.mutedForeground} /> : <Copy size={13} color={colors.mutedForeground} />}
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
            {onRegenerate ? (
              <Pressable
                accessibilityLabel="Regenerate response"
                onPress={onRegenerate}
                hitSlop={8}
                style={styles.actionButton}
              >
                <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Regenerate</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function TypingIndicator() {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInUp.duration(180)} style={styles.assistantRow}>
      <View
        style={[
          styles.typing,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  typing: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  codeStack: { gap: 8, marginTop: 10 },
  codeBlock: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.16)' },
  codeHeader: { minHeight: 30, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeLanguage: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  codeText: { padding: 10, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});