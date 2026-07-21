import request from "@/api/request";
import type { ApiResponse } from "@/api/types";

export interface VillageConversation {
  conversationId: number;
  status: string;
  unreadCount: number;
}

export interface VillageMessage {
  id: number;
  senderType: "user" | "admin";
  content: string;
  createdAt: string;
}

export const getVillageConversation = (): Promise<ApiResponse<VillageConversation>> => {
  return request.get("/api/chat/conversation");
};

export const getVillageMessages = (): Promise<ApiResponse<VillageMessage[]>> => {
  return request.get("/api/chat/messages");
};

export const sendVillageMessage = (
  content: string,
): Promise<ApiResponse<VillageMessage & { conversationId: number }>> => {
  return request.post("/api/chat/messages", { content });
};

export const getVillageLatestMessages = (
  lastMessageId: number,
): Promise<ApiResponse<VillageMessage[]>> => {
  return request.get("/api/chat/messages/latest", {
    params: {
      lastMessageId,
    },
  });
};

export const markVillageChatRead = (): Promise<ApiResponse<{
  conversationId: number;
  unreadCount: number;
}>> => {
  return request.patch("/api/chat/read");
};
