"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, Loader2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import ImageWithFallback from "@/components/ImageWithFallback";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id?: string;
    name: string | null;
    image: string | null;
  };
  isOwner?: boolean;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      setReviews(
        data.map((r: Review) => ({
          ...r,
          isOwner: session?.user?.id && r.user?.id === session.user.id,
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Avaliação enviada!");
        setShowForm(false);
        setComment("");
        setRating(5);
        fetchReviews();
      } else {
        toast.error(data.error || "Erro ao enviar avaliação");
      }
    } catch {
      toast.error("Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja excluir sua avaliação?")) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Avaliação excluída");
        fetchReviews();
      }
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">
          Avaliações ({reviews.length})
        </h2>
        {session && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-brand-400 hover:bg-slate-900/60"
          >
            <MessageSquare className="h-4 w-4" />
            {showForm ? "Cancelar" : "Avaliar produto"}
          </button>
        )}
      </div>

      {/* Resumo */}
      {reviews.length > 0 && (
        <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-900 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-100">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">{reviews.length} avaliações</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = (count / reviews.length) * 100;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-400">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="h-2 flex-1 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 p-5">
          <h3 className="font-semibold text-slate-100">Sua avaliação</h3>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="p-1"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    s <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-500 hover:text-yellow-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte sobre sua experiência com o produto (opcional)..."
            rows={4}
            className="input mt-3"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-lg bg-brand-600 px-6 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </button>
        </form>
      )}

      {/* Lista de reviews */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            Ainda não há avaliações. {session ? "Seja o primeiro a avaliar!" : "Faça login para avaliar."}
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {review.user.image ? (
                    <ImageWithFallback src={review.user.image} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-medium">
                      {(review.user.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-100">{review.user.name || "Anônimo"}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-500"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
                {review.isOwner && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-500"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
