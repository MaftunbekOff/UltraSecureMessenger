
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@shared/schema';

interface AnimatedMessageProps {
  message: Message & { sender?: any };
  isOwn: boolean;
  showAvatar: boolean;
}

export function AnimatedMessage({ message, isOwn, showAvatar }: AnimatedMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut"
      }}
      layout
    >
      <MessageBubble 
        message={message} 
        isOwn={isOwn} 
        showAvatar={showAvatar}
      />
    </motion.div>
  );
}
