
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';

interface VirtualizedMessageListProps {
  messages: any[];
  height: number;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const MessageRow = React.memo(({ index, style, data }: any) => {
  const { messages, onReply, onReact } = data;
  const message = messages[index];

  return (
    <div style={style}>
      <MessageBubble
        message={message}
        onReply={onReply}
        onReact={onReact}
      />
    </div>
  );
});

export function VirtualizedMessageList({ 
  messages, 
  height, 
  onReply, 
  onReact 
}: VirtualizedMessageListProps) {
  const itemData = React.useMemo(() => ({
    messages,
    onReply,
    onReact,
  }), [messages, onReply, onReact]);

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={80} // Estimated message height
      itemData={itemData}
      overscanCount={5}
    >
      {MessageRow}
    </List>
  );
}
