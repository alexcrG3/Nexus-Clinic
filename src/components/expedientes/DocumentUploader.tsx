import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileScan,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PdfViewer } from "./PdfViewer";

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fecha: string;
  size?: number;
}

interface DocumentUploaderProps {
  expedienteId: string;
  documentos: Documento[];
  onDocumentosChange: (documentos: Documento[]) => void;
  readOnly?: boolean;
}

const TIPOS_DOCUMENTO = [
  { value: "radiografia", label: "Radiografía", icon: FileScan },
  { value: "imagen", label: "Imagen/Foto", icon: FileImage },
  { value: "documento", label: "Documento", icon: FileText },
  { value: "examen", label: "Examen de Laboratorio", icon: FileArchive },
  { value: "otro", label: "Otro", icon: FileText },
];

export const DocumentUploader = ({
  expedienteId,
  documentos,
  onDocumentosChange,
  readOnly = false,
}: DocumentUploaderProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Documento | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB.");
        return;
      }

      setSelectedFile(file);
      setDocumentName(file.name.split('.')[0]);

      // Auto-detectar tipo
      if (file.type.startsWith('image/')) {
        setDocumentType("imagen");
        // Crear preview para imágenes
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setDocumentType("documento");
        setPreviewUrl(null);
      } else {
        setDocumentType("otro");
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${expedienteId}/${Date.now()}_${documentName.replace(/\s+/g, '_')}.${fileExt}`;

      // Subir archivo a Supabase Storage (incluye contentType para que PDFs se previsualicen bien)
      const { data, error: uploadError } = await supabase.storage
        .from("expediente-documentos")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('expediente-documentos')
        .getPublicUrl(fileName);

      const nuevoDoc: Documento = {
        id: Date.now().toString(),
        nombre: documentName,
        tipo: documentType,
        url: urlData.publicUrl,
        fecha: new Date().toISOString(),
        size: selectedFile.size,
      };

      const nuevosDocumentos = [...documentos, nuevoDoc];
      onDocumentosChange(nuevosDocumentos);

      toast.success("Documento subido exitosamente");
      setShowUploadDialog(false);
      resetForm();
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error("Error al subir documento: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Documento) => {
    try {
      // Extraer path del archivo de la URL
      const urlParts = doc.url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Eliminar de Storage
      const { error } = await supabase.storage
        .from('expediente-documentos')
        .remove([filePath]);

      if (error) throw error;

      // Actualizar lista local
      const nuevosDocumentos = documentos.filter(d => d.id !== doc.id);
      onDocumentosChange(nuevosDocumentos);

      toast.success("Documento eliminado");
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar documento");
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDocumentType("");
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getIconForType = (tipo: string) => {
    const tipoDoc = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    const IconComponent = tipoDoc?.icon || FileText;
    return <IconComponent className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (url?: string) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdf = (url?: string) => {
    if (!url) return false;
    return /\.pdf($|\?)/i.test(url);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return format(date, "d MMM yyyy", { locale: es });
    } catch {
      return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Archivos Adjuntos
            </CardTitle>
            <CardDescription>
              Documentos, radiografías y registros fotográficos
            </CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => setShowUploadDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.filter(doc => doc && doc.url).map((doc) => (
              <div
                key={doc.id || doc.nombre}
                className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {isImage(doc.url) ? (
                    <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={doc.url}
                        alt={doc.nombre || "Documento"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setViewingDoc(doc)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      {getIconForType(doc.tipo)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.nombre || "Sin nombre"}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo)?.label || doc.tipo || "Documento"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(doc.fecha)}
                      {doc.size && ` • ${formatFileSize(doc.size)}`}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setViewingDoc(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {doc.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      asChild
                    >
                      <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!readOnly && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No hay documentos adjuntos</p>
            {!readOnly && (
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir primer documento
              </Button>
            )}
          </div>
        )}

        {/* Dialog para subir documento */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Sube radiografías, imágenes o documentos del paciente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Área de carga */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-0 right-0 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para seleccionar o arrastra un archivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Imágenes, PDF o documentos (máx. 10MB)
                    </p>
                  </>
                )}
              </div>

              {selectedFile && (
                <>
                  <div className="space-y-2">
                    <Label>Nombre del documento</Label>
                    <Input
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Ej: Radiografía panorámica"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de documento</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              <tipo.icon className="h-4 w-4" />
                              {tipo.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !documentName || !documentType || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para visualizar documento */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{viewingDoc?.nombre}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg max-h-[60vh] overflow-auto">
              {viewingDoc && viewingDoc.url && isImage(viewingDoc.url) ? (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.nombre || "Documento"}
                  className="max-w-full max-h-[55vh] object-contain"
                />
              ) : viewingDoc && viewingDoc.url && isPdf(viewingDoc.url) ? (
                <PdfViewer url={viewingDoc.url} />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Vista previa no disponible
                  </p>
                  {viewingDoc?.url && (
                    <Button asChild className="mt-4">
                      <a href={viewingDoc.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar archivo
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              {viewingDoc?.url && (
                <Button asChild variant="outline">
                  <a href={viewingDoc.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </a>
                </Button>
              )}
              <Button onClick={() => setViewingDoc(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
