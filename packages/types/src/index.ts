export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
}

// Server to client Event
export interface ServerToClientEvents {
  chat_message: (data: ChatMessage) => void;
  user_joined: (user: User) => void;
  user_left: (user: User) => void;
  users_online: (user: User[]) => void;
  user_typing: (data: { username: string; isTyping: boolean }) => void;
}

// Client to server Event
export interface ClientToServerEvents {
  chat_message: (data: { username: string; message: string }) => void;
  join_room: (data: { username: string; room?: string }) => void;
  typing: (data: { username: string; isTyping: boolean }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username?: string;
  room?: string;
}
