import { useState, useRef, useEffect } from 'react';
import { streamChat } from '../services/geminiService';

// --- Type Definitions ---
export interface Action {
  label: string;
  prompt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: Action[];
}

// --- Custom Hook: useChat ---
export const useChat = (systemPrompt: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processStreamRequest = async (userContent: string, promptOverride?: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
    };

    setMessages((prev) => [
      ...prev.map(m => ({ ...m, actions: undefined })), // Hide buttons on older messages
      userMessage,
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      },
    ]);
    setIsLoading(true);

    try {
      const fullPrompt = `${systemPrompt}\n\n【相談内容】\n${promptOverride || userContent}`;
      
      const stream = streamChat(fullPrompt);

      for await (const chunk of stream) {
        setMessages(prev => prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...msg, content: msg.content + chunk } 
            : msg
        ));
      }
    } catch (error) {
      console.error('Streaming chat failed:', error);
      setMessages(prev => prev.map((msg, index) => 
        index === prev.length - 1 
          ? { ...msg, content: 'エラーが発生しました。' } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: Action) => {
    processStreamRequest(action.label, action.prompt);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    processStreamRequest(inputValue.trim());
    setInputValue('');
  };

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    messagesEndRef,
    handleActionClick,
    handleSendMessage,
  };
};
