import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);
  const timerRef = useRef(null);

  const fetchProjects = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/projects');
      setProjects(data.projects || []);
      setError(null);
      return data.projects || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    fetchProjects();
  }, [user, fetchProjects]);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchProjects({ silent: true });
    }, 350);
  }, [fetchProjects]);

  useEffect(() => {
    if (!socket) return undefined;

    const events = [
      'project:added',
      'project:updated',
      'project:removed',
      'project:deleted',
      'ticket:created',
      'ticket:updated',
      'ticket:deleted',
    ];
    events.forEach((event) => socket.on(event, scheduleRefresh));

    return () => {
      events.forEach((event) => socket.off(event, scheduleRefresh));
    };
  }, [socket, scheduleRefresh]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const value = useMemo(
    () => ({
      projects,
      loading,
      error,
      refetchProjects: fetchProjects,
      getProject: (id) => projects.find((project) => project.id === id) || null,
    }),
    [projects, loading, error, fetchProjects]
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjects must be used inside <ProjectsProvider>');
  return context;
};
