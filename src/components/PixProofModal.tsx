"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

interface PixProofModalProps {
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function PixProofModal({ orderId, onClose, onSubmitted }: PixProofModalProps) {
  const [file, setFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O limite é 2MB.");
      return;
    }

    if (!f.type.startsWith("image/")) {
      toast.error("Envie apenas imagens (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFile(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_pix_proof", paymentProof: file }),
      });
      const data = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
      if (!res.ok) throw new Error(data.error || "Erro ao enviar comprovante");
      toast.success("Comprovante enviado! Aguarde a aprovação.");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar comprovante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-slate-950 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Enviar comprovante PIX</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-400"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400">
          Tire um print do comprovante de pagamento e anexe aqui para que o dono possa aprovar o pedido.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 p-6 text-slate-400 transition-colors hover:border-brand-300 hover:bg-slate-900/60 hover:text-brand-400"
        >
          {preview ? (
            <>
              <ImageIcon className="h-5 w-5" /> Trocar imagem
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Selecionar imagem
            </>
          )}
        </button>

        {preview && (
          <div className="mt-4 overflow-hidden rounded-lg border bg-slate-900 p-2">
            <img
              src={preview}
              alt="Prévia do comprovante"
              className="mx-auto max-h-64 w-auto rounded-lg object-contain"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Já paguei"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
