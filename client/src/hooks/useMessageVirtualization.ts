
import { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

export function useMessageVirtualization(messages: any[], containerHeight: number) {
  const [scrollToIndex, setScrollToIndex] = useState<number | undefined>();
  
  const itemData = useMemo(() => ({
    messages,
    onReply: (messageId: string) => {
      // Handle reply logic
    },
    onReact: (messageId: string, emoji: string) => {
      // Handle reaction logic
    }
  }), [messages]);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      setScrollToIndex(messages.length - 1);
    }
  }, [messages.length]);

  const scrollToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      setScrollToIndex(index);
    }
  }, [messages]);

  return {
    itemData,
    scrollToIndex,
    scrollToBottom,
    scrollToMessage,
    setScrollToIndex,
  };
}
