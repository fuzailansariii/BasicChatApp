"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@repo/types/index";

type socketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocket = (serverPath: string) => {
  const [socket, setSocket] = useState<socketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket: socketType = io(serverPath);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverPath]);

  return { socket, isConnected };
};
