import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Activity, Save, Loader2, Baby, Heart, Syringe, Users, Scissors, ShieldCheck } from "lucide-react";

interface AntecedentesData {
  id?: string;
  cliente_id: string;
  enfermedades_cronicas?: string[] | null;
  alergias?: string[] | null;
  cirugias_previas?: string[] | null;
  medicamentos_actuales?: string[] | null;
  antecedentes_familiares?: string | null;
  habitos?: any;
}

interface QuickSelectProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
  detailValue: string;
  onDetailChange: (val: string) => void;
  detailPlaceholder?: string;
}

const QuickSelect = ({ label, value, onChange, detailValue, onDetailChange, detailPlaceholder }: QuickSelectProps) => (
  <div className="rounded-lg border p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Label className="font-medium">{label}</Label>
      <RadioGroup
        value={value ? "si" : "no"}
        onValueChange={(val) => onChange(val === "si")}
        className="flex items-center gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="si" id={`${label}-si`} />
          <Label htmlFor={`${label}-si`} className="text-sm cursor-pointer">Sí</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="text-sm cursor-pointer">No</Label>
        </div>
      </RadioGroup>
    </div>
    {value && (
      <Input
        value={detailValue}
        onChange={(e) => onDetailChange(e.target.value)}
        placeholder={detailPlaceholder || "Especifique..."}
        className="mt-2"
      />
    )}
  </div>
);

interface AntecedentesFormProfesionalProps {
  antecedentes: AntecedentesData | null;
  clienteId: string;
  onSave: (data: any) => Promise<void>;
  readOnly?: boolean;
}

export const AntecedentesFormProfesional = ({
  antecedentes,
  clienteId,
  onSave,
  readOnly = false,
}: AntecedentesFormProfesionalProps) => {
  const [saving, setSaving] = useState(false);
  
  // Perinatales
  const [embarazoNormal, setEmbarazoNormal] = useState(true);
  const [embarazoDetalle, setEmbarazoDetalle] = useState("");
  const [partoNormal, setPartoNormal] = useState(true);
  const [partoDetalle, setPartoDetalle] = useState("");
  const [lactancia, setLactancia] = useState(true);
  const [lactanciaDetalle, setLactanciaDetalle] = useState("");

  // No patológicos
  const [tabaquismo, setTabaquismo] = useState(false);
  const [tabaquismoDet, setTabaquismoDet] = useState("");
  const [alcohol, setAlcohol] = useState(false);
  const [alcoholDet, setAlcoholDet] = useState("");
  const [drogas, setDrogas] = useState(false);
  const [drogasDet, setDrogasDet] = useState("");
  const [ejercicio, setEjercicio] = useState("");
  const [alimentacion, setAlimentacion] = useState("");

  // Alergias
  const [tieneAlergias, setTieneAlergias] = useState(false);
  const [alergiasText, setAlergiasText] = useState("");

  // Patológicos y tratamiento
  const [diabetes, setDiabetes] = useState(false);
  const [diabetesDet, setDiabetesDet] = useState("");
  const [hipertension, setHipertension] = useState(false);
  const [hipertensionDet, setHipertensionDet] = useState("");
  const [cardiopatias, setCardiopatias] = useState(false);
  const [cardiopatiasDet, setCardiopatiasDet] = useState("");
  const [enfermedadesRespiratorias, setEnfermedadesRespiratorias] = useState(false);
  const [respiratoriasDet, setRespiratoriasDet] = useState("");
  const [otrasEnfermedades, setOtrasEnfermedades] = useState("");
  const [medicamentosActuales, setMedicamentosActuales] = useState("");

  // Familiares patológicos
  const [diabetesFam, setDiabetesFam] = useState(false);
  const [diabetesFamDet, setDiabetesFamDet] = useState("");
  const [hipertensionFam, setHipertensionFam] = useState(false);
  const [hipertensionFamDet, setHipertensionFamDet] = useState("");
  const [cancerFam, setCancerFam] = useState(false);
  const [cancerFamDet, setCancerFamDet] = useState("");
  const [cardioFam, setCardioFam] = useState(false);
  const [cardioFamDet, setCardioFamDet] = useState("");
  const [otrosFam, setOtrosFam] = useState("");

  // Cirugías y hospitalizaciones
  const [tieneCirugias, setTieneCirugias] = useState(false);
  const [cirugiasText, setCirugiasText] = useState("");
  const [tieneHospitalizaciones, setTieneHospitalizaciones] = useState(false);
  const [hospitalizacionesText, setHospitalizacionesText] = useState("");

  // Inmunizaciones
  const [vacunasCovid, setVacunasCovid] = useState(false);
  const [vacunasInfluenza, setVacunasInfluenza] = useState(false);
  const [vacunasTetanos, setVacunasTetanos] = useState(false);
  const [otrasVacunas, setOtrasVacunas] = useState("");

  useEffect(() => {
    if (antecedentes) {
      const habitos = antecedentes.habitos || {};
      
      // Perinatales
      setEmbarazoNormal(!habitos.embarazo_complicado);
      setEmbarazoDetalle(habitos.embarazo_detalle || "");
      setPartoNormal(!habitos.parto_complicado);
      setPartoDetalle(habitos.parto_detalle || "");
      setLactancia(habitos.lactancia || true);
      setLactanciaDetalle(habitos.lactancia_detalle || "");

      // No patológicos
      setTabaquismo(habitos.tabaquismo || false);
      setTabaquismoDet(habitos.tabaquismo_detalle || "");
      setAlcohol(habitos.alcohol || false);
      setAlcoholDet(habitos.alcohol_detalle || "");
      setDrogas(habitos.drogas || false);
      setDrogasDet(habitos.drogas_detalle || "");
      setEjercicio(habitos.ejercicio || "");
      setAlimentacion(habitos.alimentacion || "");

      // Alergias
      setTieneAlergias((antecedentes.alergias?.length || 0) > 0);
      setAlergiasText(antecedentes.alergias?.join(", ") || "");

      // Patológicos
      const enfermedades = antecedentes.enfermedades_cronicas || [];
      setDiabetes(enfermedades.some(e => e.toLowerCase().includes("diabetes")));
      setDiabetesDet(enfermedades.find(e => e.toLowerCase().includes("diabetes")) || "");
      setHipertension(enfermedades.some(e => e.toLowerCase().includes("hipertension") || e.toLowerCase().includes("hipertensión")));
      setHipertensionDet(enfermedades.find(e => e.toLowerCase().includes("hipertension")) || "");
      setCardiopatias(enfermedades.some(e => e.toLowerCase().includes("cardio") || e.toLowerCase().includes("corazón")));
      setCardiopatiasDet(enfermedades.find(e => e.toLowerCase().includes("cardio")) || "");
      setEnfermedadesRespiratorias(enfermedades.some(e => e.toLowerCase().includes("asma") || e.toLowerCase().includes("respirat")));
      setRespiratoriasDet(enfermedades.find(e => e.toLowerCase().includes("asma") || e.toLowerCase().includes("respirat")) || "");
      setOtrasEnfermedades(enfermedades.filter(e => 
        !e.toLowerCase().includes("diabetes") && 
        !e.toLowerCase().includes("hipertension") &&
        !e.toLowerCase().includes("cardio") &&
        !e.toLowerCase().includes("asma")
      ).join(", "));
      setMedicamentosActuales(antecedentes.medicamentos_actuales?.join(", ") || "");

      // Familiares
      const familiares = antecedentes.antecedentes_familiares || "";
      setDiabetesFam(familiares.toLowerCase().includes("diabetes"));
      setHipertensionFam(familiares.toLowerCase().includes("hipertension") || familiares.toLowerCase().includes("hipertensión"));
      setCancerFam(familiares.toLowerCase().includes("cancer") || familiares.toLowerCase().includes("cáncer"));
      setCardioFam(familiares.toLowerCase().includes("cardio") || familiares.toLowerCase().includes("corazón"));
      setOtrosFam(familiares);

      // Cirugías
      setTieneCirugias((antecedentes.cirugias_previas?.length || 0) > 0);
      setCirugiasText(antecedentes.cirugias_previas?.join(", ") || "");
      setTieneHospitalizaciones(habitos.hospitalizaciones || false);
      setHospitalizacionesText(habitos.hospitalizaciones_detalle || "");

      // Inmunizaciones
      setVacunasCovid(habitos.vacuna_covid || false);
      setVacunasInfluenza(habitos.vacuna_influenza || false);
      setVacunasTetanos(habitos.vacuna_tetanos || false);
      setOtrasVacunas(habitos.otras_vacunas || "");
    }
  }, [antecedentes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const enfermedadesArr: string[] = [];
      if (diabetes && diabetesDet) enfermedadesArr.push(diabetesDet);
      if (hipertension && hipertensionDet) enfermedadesArr.push(hipertensionDet);
      if (cardiopatias && cardiopatiasDet) enfermedadesArr.push(cardiopatiasDet);
      if (enfermedadesRespiratorias && respiratoriasDet) enfermedadesArr.push(respiratoriasDet);
      if (otrasEnfermedades) enfermedadesArr.push(...otrasEnfermedades.split(",").map(s => s.trim()).filter(Boolean));

      await onSave({
        id: antecedentes?.id,
        cliente_id: clienteId,
        enfermedades_cronicas: enfermedadesArr,
        alergias: tieneAlergias ? alergiasText.split(",").map(s => s.trim()).filter(Boolean) : [],
        cirugias_previas: tieneCirugias ? cirugiasText.split(",").map(s => s.trim()).filter(Boolean) : [],
        medicamentos_actuales: medicamentosActuales.split(",").map(s => s.trim()).filter(Boolean),
        antecedentes_familiares: otrosFam || [
          diabetesFam ? `Diabetes: ${diabetesFamDet || "Sí"}` : null,
          hipertensionFam ? `Hipertensión: ${hipertensionFamDet || "Sí"}` : null,
          cancerFam ? `Cáncer: ${cancerFamDet || "Sí"}` : null,
          cardioFam ? `Cardiopatía: ${cardioFamDet || "Sí"}` : null,
        ].filter(Boolean).join("; "),
        habitos: {
          embarazo_complicado: !embarazoNormal,
          embarazo_detalle: embarazoDetalle,
          parto_complicado: !partoNormal,
          parto_detalle: partoDetalle,
          lactancia,
          lactancia_detalle: lactanciaDetalle,
          tabaquismo,
          tabaquismo_detalle: tabaquismoDet,
          alcohol,
          alcohol_detalle: alcoholDet,
          drogas,
          drogas_detalle: drogasDet,
          ejercicio,
          alimentacion,
          hospitalizaciones: tieneHospitalizaciones,
          hospitalizaciones_detalle: hospitalizacionesText,
          vacuna_covid: vacunasCovid,
          vacuna_influenza: vacunasInfluenza,
          vacuna_tetanos: vacunasTetanos,
          otras_vacunas: otrasVacunas,
        },
      });
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Antecedentes Médicos
        </CardTitle>
        <CardDescription>
          Historia clínica completa del paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["perinatales", "no-patologicos", "alergias"]} className="w-full">
          {/* Perinatales */}
          <AccordionItem value="perinatales">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                <span>Antecedentes Perinatales</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="Embarazo normal"
                value={embarazoNormal}
                onChange={(v) => setEmbarazoNormal(v)}
                detailValue={embarazoDetalle}
                onDetailChange={setEmbarazoDetalle}
                detailPlaceholder="Complicaciones durante el embarazo..."
              />
              <QuickSelect
                label="Parto normal"
                value={partoNormal}
                onChange={(v) => setPartoNormal(v)}
                detailValue={partoDetalle}
                onDetailChange={setPartoDetalle}
                detailPlaceholder="Tipo de parto o complicaciones..."
              />
              <QuickSelect
                label="Lactancia materna"
                value={lactancia}
                onChange={(v) => setLactancia(v)}
                detailValue={lactanciaDetalle}
                onDetailChange={setLactanciaDetalle}
                detailPlaceholder="Duración o tipo de alimentación..."
              />
            </AccordionContent>
          </AccordionItem>

          {/* No patológicos */}
          <AccordionItem value="no-patologicos">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Antecedentes No Patológicos (Hábitos)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="Tabaquismo"
                value={tabaquismo}
                onChange={setTabaquismo}
                detailValue={tabaquismoDet}
                onDetailChange={setTabaquismoDet}
                detailPlaceholder="Cantidad, frecuencia, años..."
              />
              <QuickSelect
                label="Consumo de alcohol"
                value={alcohol}
                onChange={setAlcohol}
                detailValue={alcoholDet}
                onDetailChange={setAlcoholDet}
                detailPlaceholder="Tipo, frecuencia..."
              />
              <QuickSelect
                label="Consumo de drogas"
                value={drogas}
                onChange={setDrogas}
                detailValue={drogasDet}
                onDetailChange={setDrogasDet}
                detailPlaceholder="Tipo de sustancias..."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ejercicio físico</Label>
                  <Input
                    value={ejercicio}
                    onChange={(e) => setEjercicio(e.target.value)}
                    placeholder="Frecuencia y tipo de ejercicio..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alimentación</Label>
                  <Input
                    value={alimentacion}
                    onChange={(e) => setAlimentacion(e.target.value)}
                    placeholder="Tipo de dieta..."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Alergias */}
          <AccordionItem value="alergias">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-primary" />
                <span>Alergias</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="¿Tiene alergias conocidas?"
                value={tieneAlergias}
                onChange={setTieneAlergias}
                detailValue={alergiasText}
                onDetailChange={setAlergiasText}
                detailPlaceholder="Liste las alergias separadas por coma..."
              />
            </AccordionContent>
          </AccordionItem>

          {/* Patológicos y tratamiento */}
          <AccordionItem value="patologicos">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Antecedentes Patológicos y Tratamiento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="Diabetes"
                value={diabetes}
                onChange={setDiabetes}
                detailValue={diabetesDet}
                onDetailChange={setDiabetesDet}
                detailPlaceholder="Tipo, tratamiento..."
              />
              <QuickSelect
                label="Hipertensión arterial"
                value={hipertension}
                onChange={setHipertension}
                detailValue={hipertensionDet}
                onDetailChange={setHipertensionDet}
                detailPlaceholder="Tratamiento actual..."
              />
              <QuickSelect
                label="Cardiopatías"
                value={cardiopatias}
                onChange={setCardiopatias}
                detailValue={cardiopatiasDet}
                onDetailChange={setCardiopatiasDet}
                detailPlaceholder="Especifique..."
              />
              <QuickSelect
                label="Enfermedades respiratorias (Asma, EPOC...)"
                value={enfermedadesRespiratorias}
                onChange={setEnfermedadesRespiratorias}
                detailValue={respiratoriasDet}
                onDetailChange={setRespiratoriasDet}
                detailPlaceholder="Especifique..."
              />
              <div className="space-y-2">
                <Label>Otras enfermedades crónicas</Label>
                <Textarea
                  value={otrasEnfermedades}
                  onChange={(e) => setOtrasEnfermedades(e.target.value)}
                  placeholder="Otras enfermedades separadas por coma..."
                  rows={2}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Medicamentos actuales</Label>
                <Textarea
                  value={medicamentosActuales}
                  onChange={(e) => setMedicamentosActuales(e.target.value)}
                  placeholder="Liste los medicamentos separados por coma..."
                  rows={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Familiares patológicos */}
          <AccordionItem value="familiares">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Antecedentes Familiares Patológicos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="Diabetes en familia"
                value={diabetesFam}
                onChange={setDiabetesFam}
                detailValue={diabetesFamDet}
                onDetailChange={setDiabetesFamDet}
                detailPlaceholder="¿Quién? (padre, madre, abuelos...)"
              />
              <QuickSelect
                label="Hipertensión en familia"
                value={hipertensionFam}
                onChange={setHipertensionFam}
                detailValue={hipertensionFamDet}
                onDetailChange={setHipertensionFamDet}
                detailPlaceholder="¿Quién?"
              />
              <QuickSelect
                label="Cáncer en familia"
                value={cancerFam}
                onChange={setCancerFam}
                detailValue={cancerFamDet}
                onDetailChange={setCancerFamDet}
                detailPlaceholder="¿Quién y tipo de cáncer?"
              />
              <QuickSelect
                label="Cardiopatías en familia"
                value={cardioFam}
                onChange={setCardioFam}
                detailValue={cardioFamDet}
                onDetailChange={setCardioFamDet}
                detailPlaceholder="¿Quién?"
              />
              <div className="space-y-2">
                <Label>Otros antecedentes familiares</Label>
                <Textarea
                  value={otrosFam}
                  onChange={(e) => setOtrosFam(e.target.value)}
                  placeholder="Otros antecedentes familiares relevantes..."
                  rows={2}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Cirugías y hospitalizaciones */}
          <AccordionItem value="cirugias">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" />
                <span>Cirugías y Hospitalizaciones</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <QuickSelect
                label="¿Ha tenido cirugías previas?"
                value={tieneCirugias}
                onChange={setTieneCirugias}
                detailValue={cirugiasText}
                onDetailChange={setCirugiasText}
                detailPlaceholder="Liste las cirugías con año aproximado..."
              />
              <QuickSelect
                label="¿Ha tenido hospitalizaciones?"
                value={tieneHospitalizaciones}
                onChange={setTieneHospitalizaciones}
                detailValue={hospitalizacionesText}
                onDetailChange={setHospitalizacionesText}
                detailPlaceholder="Motivo y año aproximado..."
              />
            </AccordionContent>
          </AccordionItem>

          {/* Inmunizaciones */}
          <AccordionItem value="inmunizaciones">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Inmunizaciones</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">COVID-19</Label>
                    <RadioGroup
                      value={vacunasCovid ? "si" : "no"}
                      onValueChange={(val) => setVacunasCovid(val === "si")}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="covid-si" />
                        <Label htmlFor="covid-si" className="text-sm cursor-pointer">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="covid-no" />
                        <Label htmlFor="covid-no" className="text-sm cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Influenza</Label>
                    <RadioGroup
                      value={vacunasInfluenza ? "si" : "no"}
                      onValueChange={(val) => setVacunasInfluenza(val === "si")}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="influenza-si" />
                        <Label htmlFor="influenza-si" className="text-sm cursor-pointer">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="influenza-no" />
                        <Label htmlFor="influenza-no" className="text-sm cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Tétanos</Label>
                    <RadioGroup
                      value={vacunasTetanos ? "si" : "no"}
                      onValueChange={(val) => setVacunasTetanos(val === "si")}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="tetanos-si" />
                        <Label htmlFor="tetanos-si" className="text-sm cursor-pointer">Sí</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="tetanos-no" />
                        <Label htmlFor="tetanos-no" className="text-sm cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Otras vacunas</Label>
                <Input
                  value={otrasVacunas}
                  onChange={(e) => setOtrasVacunas(e.target.value)}
                  placeholder="Hepatitis, fiebre amarilla, etc..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {!readOnly && (
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Antecedentes
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
