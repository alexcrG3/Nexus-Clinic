import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Required by pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  url: string;
};

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setNumPages(0);
    setLoading(true);
    setLoadError(null);
  }, [url]);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth || 800);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = useMemo(() => {
    // Leave some padding in the dialog
    return Math.max(320, Math.min(containerWidth - 16, 900));
  }, [containerWidth]);

  const canPrev = page > 1;
  const canNext = numPages > 0 && page < numPages;

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>

        <p className="text-sm text-muted-foreground">
          {numPages > 0 ? `Página ${page} de ${numPages}` : "Cargando…"}
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => setPage((p) => Math.min(numPages || p + 1, p + 1))}
        >
          Siguiente
        </Button>
      </div>

      <div className="flex w-full justify-center">
        <Document
          file={url}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando PDF…</p>
            </div>
          }
          onLoadSuccess={(info) => {
            setNumPages(info.numPages);
            setLoading(false);
          }}
          onLoadError={(err) => {
            setLoading(false);
            setLoadError(err?.message || "Error al cargar el PDF");
          }}
          error={
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No se pudo previsualizar el PDF.
              </p>
              <p className="mt-1 text-xs text-muted-foreground break-words">
                {loadError}
              </p>
            </div>
          }
        >
          {!loading && !loadError && (
            <Page
              pageNumber={page}
              width={pageWidth}
              renderAnnotationLayer
              renderTextLayer
            />
          )}
        </Document>
      </div>
    </div>
  );
}
