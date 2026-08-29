import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Cake, Weight, CreditCard } from "lucide-react";
import { parseISO, differenceInYears, differenceInMonths } from "date-fns";

interface PatientHeaderProps {
  cliente: {
    id: string;
    nombre: string | null;
    apellidos: string | null;
    cedula: string | null;
    fecha_nacimiento: string | null;
    sexo: string | null;
    avatar_url?: string | null;
  } | null;
  peso?: string | number | null;
}

export const PatientHeader = ({ cliente, peso }: PatientHeaderProps) => {
  const calcularEdadCompleta = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return null;
    const nacimiento = parseISO(fechaNacimiento);
    const hoy = new Date();
    const años = differenceInYears(hoy, nacimiento);
    const mesesTotal = differenceInMonths(hoy, nacimiento);
    const meses = mesesTotal % 12;
    return { años, meses };
  };

  const edad = calcularEdadCompleta(cliente?.fecha_nacimiento || null);
  const iniciales = `${cliente?.nombre?.charAt(0) || ""}${cliente?.apellidos?.charAt(0) || ""}`.toUpperCase();

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={(cliente as any)?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {iniciales || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {cliente?.nombre} {cliente?.apellidos}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {edad && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Cake className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {edad.años} años{edad.meses > 0 ? `, ${edad.meses} meses` : ""}
                  </span>
                </div>
              )}
              
              {peso && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Weight className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {peso} kg
                  </span>
                </div>
              )}
              
              {cliente?.cedula && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {cliente.cedula}
                  </span>
                </div>
              )}
            </div>
          </div>

          {cliente?.sexo && (
            <Badge variant="outline" className="hidden sm:flex">
              {cliente.sexo}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
