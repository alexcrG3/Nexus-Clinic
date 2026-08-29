import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


// Correo autorizado como SuperAdministrador Global de la Plataforma SaaS (Dueño del Sistema)
export const SAAS_SUPERADMIN_EMAILS = [
  'admin@medicr.com',
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role after auth state changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
          setUserRole(null);
          setRoleLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRoles([]);
        setUserRole(null);
        setRoleLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    setRoleLoading(true);

    try {
      // 1. Verificar si es SuperAdmin Global de la Plataforma SaaS
      const userEmail = session?.user?.email?.toLowerCase() || user?.email?.toLowerCase();

      if (userEmail && SAAS_SUPERADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)) {
        setUserRoles(['admin_sistema']);
        setUserRole('admin_sistema');
        setRoleLoading(false);
        return;
      }

      // 2. Consultar roles asignados dentro de la clínica
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        setUserRoles(['admin_clinica']);
        setUserRole('admin_clinica');
        setRoleLoading(false);
        return;
      }

      if (rolesData && rolesData.length > 0) {
        const roles: string[] = rolesData.map(r => r.role);
        setUserRoles(roles);

        const roleHierarchy: string[] = [
          'admin_sistema',
          'admin_clinica',
          'medico',
          'odontologo',
          'quiropractico',
          'fisioterapeuta',
          'recepcionista',
          'paciente',
        ];

        const primaryRole = roleHierarchy.find(r => roles.includes(r)) || roles[0];
        setUserRole(primaryRole);
      } else {
        // Auto-asignar admin_clinica por defecto para el personal clínico
        setUserRoles(['admin_clinica']);
        setUserRole('admin_clinica');
      }
    } catch (e) {
      setUserRoles(['admin_clinica']);
      setUserRole('admin_clinica');
    } finally {
      setRoleLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Clear local state immediately so redirects work even if network is slow
    setSession(null);
    setUser(null);
    setUserRoles([]);
    setUserRole(null);
    setRoleLoading(false);
    setLoading(false);

    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.error('[AuthContext] signOut error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roleLoading, signIn, signUp, signOut, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
