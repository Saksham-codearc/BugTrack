import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setConnected(false);
      return undefined;
    }

    const instance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 12,
      reconnectionDelay: 1200,
    });

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.on('connect_error', () => setConnected(false));

    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token, user]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside <SocketProvider>');
  return context;
};
