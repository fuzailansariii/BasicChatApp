"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { ChatMessage, User } from "@repo/types/index";
import { Send, Users, Wifi, WifiOff } from "lucide-react";
import clsx from "clsx";

export default function Chat() {
  const { isConnected, socket } = useSocket("http://localhost:4000");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to the end
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat_message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("users_online", (data) => {
      setUser(data);
    });

    socket.on("user_joined", (user) => {
      setUser((prevUsers) => [...prevUsers, user]);
    });

    socket.on("user_left", (user) => {
      setUser((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
    });

    socket.on("user_typing", ({ username: typingUsername, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) =>
          prev.includes(typingUsername) ? prev : [...prev, typingUsername]
        );
      } else {
        setTypingUsers((prev) =>
          prev.filter((user) => user !== typingUsername)
        );
      }
    });

    return () => {
      socket.off("chat_message");
      socket.off("users_online");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("user_typing");
    };
  }, [socket]);

  const joinChat = () => {
    if (!socket || !username.trim()) return;
    socket.emit("join_room", { username });
    setHasJoined(true);
  };

  const sendMessage = () => {
    if (!socket || !message.trim() || !hasJoined) return;
    socket.emit("chat_message", { username, message: message.trim() });
    setMessage("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("typing", { username, isTyping: false });
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!socket || !hasJoined) return;

    socket.emit("typing", { username, isTyping: true });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { username, isTyping: false });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasJoined) {
        sendMessage();
      } else {
        joinChat();
      }
    }
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Chat</h1>
            <p className="text-gray-600">Enter your name to start chatting</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyUp={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              maxLength={20}
            />

            <button
              onClick={joinChat}
              disabled={!username.trim() || !isConnected}
              className={clsx(
                "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                username.trim() && isConnected
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {isConnected ? "Join Chat" : "Connecting..."}
            </button>

            <div className="flex items-center justify-center space-x-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Users List */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">
              Online Users ({user.length})
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {user.map((user) => (
            <div key={user.id} className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={clsx(
                  "text-sm",
                  user.username === username
                    ? "font-semibold text-blue-600"
                    : "text-gray-700"
                )}
              >
                {user.username} {user.username === username && "(You)"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-[14px] border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              General Chat
            </h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex",
                msg.username === username ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={clsx(
                  "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                  msg.username === username
                    ? "bg-blue-500 text-white"
                    : "bg-white shadow-sm"
                )}
              >
                <div className="text-xs opacity-75 mb-1">
                  {msg.username} • {msg.timestamp}
                </div>
                <div className="break-words">{msg.message}</div>
              </div>
            </div>
          ))}

          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-200 px-4 py-2 rounded-lg">
                <div className="text-sm text-gray-600">
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing
                  <span className="animate-pulse-slow">...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || !isConnected}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                message.trim() && isConnected
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
