import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AsignarDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expedienteId: string;
  pacienteNombre: string;
}

type DoctorRow = {
  id: string;
  nombre: string;
  especialidad: string | null;
  user_id: string | null;
  activo: boolean | null;
};

type UsuarioMedico = {
  user_id: string;
  id: string;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  activo?: boolean | null;
  role: string;
};

type DoctorProfileRow = {
  user_id: string;
  id: string;
};

export const AsignarDoctorDialog = ({
  open,
  onOpenChange,
  expedienteId,
  pacienteNombre,
}: AsignarDoctorDialogProps) => {
  const [doctorId, setDoctorId] = useState<string>("");
  const [usuarioId, setUsuarioId] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setDoctorId("");
      setUsuarioId("");
    }
  }, [open]);

  const { data: doctores = [], isLoading: doctoresLoading } = useQuery<DoctorRow[]>({
    queryKey: ["doctores-lista-con-perfil"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad, user_id, activo")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      return (data || []) as DoctorRow[];
    },
  });

  const doctorUserIds = useMemo(() => {
    const ids = (doctores || [])
      .map((d) => d.user_id)
      .filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [doctores]);

  const { data: doctorProfiles = [] } = useQuery<DoctorProfileRow[]>({
    queryKey: ["doctor-profiles-by-user", doctorUserIds],
    enabled: doctorUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, id")
        .in("user_id", doctorUserIds);

      if (error) throw error;
      return (data || []) as DoctorProfileRow[];
    },
  });

  const profileIdByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of doctorProfiles) map[p.user_id] = p.id;
    return map;
  }, [doctorProfiles]);

  const selectedDoctor = useMemo(() => {
    if (!doctorId) return null;
    return doctores.find((d) => d.id === doctorId) || null;
  }, [doctores, doctorId]);

  const doctorNeedsLinking = !!selectedDoctor && !selectedDoctor.user_id;

  const selectedDoctorProfileId = useMemo(() => {
    if (!selectedDoctor?.user_id) return null;
    return profileIdByUserId[selectedDoctor.user_id] || null;
  }, [profileIdByUserId, selectedDoctor?.user_id]);

  const showProfileMissingNote = !!selectedDoctor && !!selectedDoctor.user_id && !selectedDoctorProfileId;

  const { data: usuariosMedicos = [], isLoading: usuariosLoading } = useQuery<UsuarioMedico[]>({
    queryKey: ["usuarios-medicos-para-vincular"],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["medico", "odontologo", "fisioterapeuta", "quiropractico"]);

      if (rolesError) throw rolesError;

      const userIds = (rolesData || []).map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, id, nombre, apellidos, email, activo")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const roleByUserId: Record<string, string> = {};
      for (const r of rolesData || []) roleByUserId[r.user_id] = r.role;

      return (profilesData || []).map((p) => ({
        ...p,
        role: roleByUserId[p.user_id] || "",
      })) as UsuarioMedico[];
    },
  });

  const usuariosDisponibles = useMemo(() => {
    const linkedUserIds = new Set(
      (doctores || []).map((d) => d.user_id).filter(Boolean) as string[],
    );

    return (usuariosMedicos || []).filter((u) => !linkedUserIds.has(u.user_id));
  }, [doctores, usuariosMedicos]);

  const asignarDoctor = useMutation({
    mutationFn: async (data: { expediente_id: string; doctor_id: string; usuario_id?: string }) => {
      const doctor = doctores.find((d) => d.id === data.doctor_id);
      if (!doctor) throw new Error("No se encontró el doctor seleccionado.");

      // 1) Si el doctor no tiene usuario vinculado, lo vinculamos aquí mismo
      let doctorUserId = doctor.user_id;
      if (!doctorUserId) {
        if (!data.usuario_id) {
          throw new Error(
            "Este doctor no tiene un usuario vinculado. Selecciona el usuario correspondiente para vincularlo.",
          );
        }

        const alreadyLinked = doctores.find((d) => d.user_id === data.usuario_id && d.id !== doctor.id);
        if (alreadyLinked) {
          throw new Error(`Este usuario ya está vinculado a ${alreadyLinked.nombre}.`);
        }

        const { error: linkError } = await supabase
          .from("doctores")
          .update({ user_id: data.usuario_id })
          .eq("id", doctor.id);

        if (linkError) throw linkError;

        doctorUserId = data.usuario_id;
      }

      // 2) Necesitamos el profile.id para guardar en expedientes.profesional_id
      let profileId = profileIdByUserId[doctorUserId] || null;
      if (!profileId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", doctorUserId)
          .single();

        if (profileError || !profile) {
          throw new Error(
            "No se encontró el perfil del usuario vinculado. Asegúrate de que el doctor tenga una cuenta registrada.",
          );
        }

        profileId = profile.id;
      }

      const { error: updateError } = await supabase
        .from("expedientes")
        .update({ profesional_id: profileId })
        .eq("id", data.expediente_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctores-lista-con-perfil"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios-medicos-para-vincular"] });
      toast.success("Doctor asignado exitosamente");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al asignar doctor: " + error.message);
    },
  });

  const handleDoctorChange = (value: string) => {
    setDoctorId(value);
    setUsuarioId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorId) {
      toast.error("Selecciona un doctor");
      return;
    }

    if (doctorNeedsLinking && !usuarioId) {
      toast.error("Este doctor no está vinculado. Selecciona el usuario para vincularlo.");
      return;
    }

    await asignarDoctor.mutateAsync({
      expediente_id: expedienteId,
      doctor_id: doctorId,
      usuario_id: usuarioId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Asignar Doctor</DialogTitle>
          <DialogDescription>Asignar un doctor al expediente de {pacienteNombre}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Doctor *</Label>
            <Select value={doctorId} onValueChange={handleDoctorChange}>
              <SelectTrigger>
                <SelectValue placeholder={doctoresLoading ? "Cargando doctores..." : "Seleccionar doctor"} />
              </SelectTrigger>
              <SelectContent>
                {doctores.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay doctores activos</div>
                ) : (
                  doctores.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ""}
                      {!doc.user_id ? " — sin usuario" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {showProfileMissingNote && (
              <p className="text-xs text-muted-foreground">
                Nota: este doctor tiene usuario vinculado, pero no se encontró su perfil. Si el asignado falla,
                revisa el usuario en el sistema.
              </p>
            )}
          </div>

          {doctorNeedsLinking && (
            <div className="space-y-2">
              <Label>Usuario del doctor *</Label>
              <Select value={usuarioId} onValueChange={setUsuarioId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={usuariosLoading ? "Cargando usuarios..." : "Seleccionar usuario para vincular"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDisponibles.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay usuarios médicos disponibles para vincular
                    </div>
                  ) : (
                    usuariosDisponibles.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.nombre} {u.apellidos} {u.email ? `(${u.email})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Este doctor no tiene usuario vinculado. Al asignar, lo vincularemos automáticamente para evitar que
                el error vuelva a ocurrir.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                asignarDoctor.isPending ||
                doctoresLoading ||
                (doctorNeedsLinking && (usuariosLoading || !usuarioId))
              }
            >
              {asignarDoctor.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
