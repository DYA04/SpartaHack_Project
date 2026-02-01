import api from '../api';
import { Job } from '@/types/matching';

export interface Message {
  id: string;
  conversation: string;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
}

export interface LastMessage {
  content: string;
  sender_username: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  job: Job;
  volunteer_id: number;
  volunteer_username: string;
  poster_id: number;
  poster_username: string;
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/chat/conversations');
    return response.data;
  },

  async getMessages(conversationId: string): Promise<ConversationWithMessages> {
    const response = await api.get<ConversationWithMessages>(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post<Message>(`/chat/conversations/${conversationId}/send`, { content });
    return response.data;
  },

  async getConversationByJob(jobId: string): Promise<Conversation> {
    const response = await api.get<Conversation>(`/chat/job/${jobId}/conversation`);
    return response.data;
  },
};
