import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Stethoscope, 
  Shield, 
  Users, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Info, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  User,
  Heart,
  Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicConfig } from '@/hooks/useClinicConfig';

const Auth = () => {
  const { signIn, signUp, user, loading, roleLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: config } = useClinicConfig();
  const clinicName = config?.nombre_clinica || "Nova Dental";
  
  const redirectTarget = searchParams.get('redirect');

  useEffect(() => {
    if (!loading && !roleLoading && user) {
      const isSuperAdmin = user.email?.toLowerCase() === 'admin@medicr.com' || userRole === 'admin_sistema';

      if (userRole === 'paciente') {
        navigate('/paciente');
      } else if (redirectTarget) {
        navigate(redirectTarget);
      } else if (isSuperAdmin) {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, roleLoading, userRole, navigate, redirectTarget]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [accountType, setAccountType] = useState<'paciente' | 'staff'>('paciente');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Error al iniciar sesión',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bienvenido',
          description: 'Has iniciado sesión correctamente',
        });
        if (email.toLowerCase() === 'admin@medicr.com') {
          navigate('/superadmin');
        }
      }
    } else {
      // Registrarse
      const { error } = await signUp(email, password, {
        nombre,
        apellidos,
        telefono,
        account_type: accountType,
      });

      if (error) {
        toast({
          title: 'Error al registrarse',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        if (accountType === 'paciente') {
          // Asignar rol paciente inmediatamente
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from('user_roles').insert({
              user_id: newUser.id,
              role: 'paciente',
            }).catch(() => {});

            // Vincular en tabla clientes
            await supabase.from('clientes').insert({
              nombre,
              apellidos,
              email,
              telefono,
              user_id: newUser.id,
            }).catch(() => {});
          }

          toast({
            title: '¡Cuenta de Paciente Creada!',
            description: 'Bienvenido a tu portal de salud dental.',
          });
          navigate('/paciente');
        } else {
          toast({
            title: 'Solicitud enviada',
            description: 'Un administrador de la clínica revisará tu solicitud de acceso médico.',
          });
          setIsLogin(true);
        }

        setEmail('');
        setPassword('');
        setNombre('');
        setApellidos('');
        setTelefono('');
      }
    }
    setSubmitting(false);
  };

  const features = [
    {
      icon: Clock,
      title: "Disponibilidad 24/7",
      description: "Asistente virtual que responde a cualquier hora"
    },
    {
      icon: Calendar,
      title: "Reserva automática",
      description: "Agenda y consulta citas en tiempo real"
    },
    {
      icon: MessageSquare,
      title: "Historial y Recordatorios",
      description: "Avisos por WhatsApp y seguimiento de recetas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center py-10">
        
        {/* Lado Izquierdo - Branding */}
        <div className="text-white space-y-8 text-left">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{clinicName}</h1>
              <p className="text-white/80 text-base font-medium">Clínica Odontológica & Salud Digital</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Tu salud dental, citas y tratamientos en un solo lugar
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Inicia sesión para gestionar tus citas, consultar recetas o acceder al panel clínico institucional.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-2 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="h-10 w-10 mx-auto rounded-xl bg-white/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs">{feature.title}</h3>
                  <p className="text-[10px] text-white/70 mt-0.5 hidden md:block">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-2 text-white/80 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Datos 100% Encriptados</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span>Asistente IA Conectado</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Formulario de Login / Registro */}
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white text-slate-900">
          <CardHeader className="text-center space-y-1.5 pb-4 bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-2xl font-black text-slate-900">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {isLogin 
                ? 'Ingresa tus credenciales para acceder a tus citas o panel'
                : 'Completa tus datos para crear tu cuenta personal'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Selector de Tipo de Cuenta si es Registro */}
              {!isLogin && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold">Tipo de Cuenta</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccountType('paciente')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        accountType === 'paciente'
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-5 h-5 shrink-0" />
                      <div className="leading-tight">
                        <span className="text-xs block">Soy Paciente</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Acceso inmediato</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('staff')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        accountType === 'staff'
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Stethoscope className="w-5 h-5 shrink-0" />
                      <div className="leading-tight">
                        <span className="text-xs block">Doctor / Personal</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Requiere validación</span>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="nombre" className="text-xs">Nombre</Label>
                      <Input
                        id="nombre"
                        type="text"
                        placeholder="Ana"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="apellidos" className="text-xs">Apellidos</Label>
                      <Input
                        id="apellidos"
                        type="text"
                        placeholder="García"
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        required
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="telefono" className="text-xs">Teléfono / WhatsApp</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="55 1234 5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-bold">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-bold">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botón Principal */}
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-11 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 transition-all mt-2"
              >
                {submitting ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Toggle Login/Registro */}
              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="hover:underline text-slate-700 font-semibold"
                >
                  {isLogin 
                    ? '¿No tienes cuenta? Regístrate aquí' 
                    : '¿Ya tienes una cuenta? Inicia sesión'
                  }
                </button>
              </div>

              {/* Accesos Rápidos de Prueba */}
              <div className="pt-3 border-t border-slate-100 text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  ⚡ Cuentas de Prueba:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@medicr.com");
                      setPassword("admin123");
                      setIsLogin(true);
                    }}
                    className="p-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-left text-[11px] font-bold transition-all"
                  >
                    👑 SuperAdmin (Centro Mando)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("doctor@medicr.com");
                      setPassword("doctor123");
                      setIsLogin(true);
                    }}
                    className="p-2 rounded-xl border border-primary/20 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left text-[11px] font-semibold transition-all"
                  >
                    👨‍⚕️ Doctor / Clínica
                  </button>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Auth;
