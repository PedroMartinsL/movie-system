import { X, Globe, Calendar, Subtitles, Play } from "lucide-react";
import type { Movie } from "../types";
import { GENRE_LABELS } from "../types";
import { useEffect, useState } from "react";
import { storage, subtitles as subtitlesApi, mediaUrl, type SubtitleTrack } from "../../services/api";

interface MovieModalProps {
  movie: Movie;
  onClose: () => void;
}

export function MovieModal({ movie, onClose }: MovieModalProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);

  useEffect(() => {
    subtitlesApi.list(movie.id).then(setTracks).catch(() => {});
  }, [movie.id]);

  async function handlePlay() {
    if (!movie.id || !movie.videoUrl) return;
    setStreamUrl(mediaUrl(`/storage/stream/${movie.id}`));
    setShowVideo(true);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border overflow-hidden"
        style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
          style={{ background: "rgba(10,10,11,0.8)" }}
        >
          <X size={18} />
        </button>

        {/* Poster / Video area */}
        <div className="relative overflow-hidden" style={{ height: "280px", background: "#000" }}>
          {showVideo ? (
            <video
              src={streamUrl ?? undefined}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <img
                src={mediaUrl(movie.imgUrl) || undefined}
                alt={movie.title}
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.45)" }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 55%)" }}
              />
              <button
                onClick={handlePlay}
                disabled={loadingStream}
                className="absolute inset-0 flex items-center justify-center group disabled:cursor-wait"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-primary group-hover:bg-primary transition-all duration-200"
                  style={{ background: "rgba(10,10,11,0.7)" }}
                >
                  {loadingStream
                    ? <span className="text-primary text-xs">...</span>
                    : <Play size={24} className="text-primary group-hover:text-primary-foreground" fill="currentColor" />
                  }
                </div>
              </button>
              <div className="absolute bottom-4 left-6 right-14">
                <span
                  className="inline-block px-2 py-0.5 rounded border border-primary text-primary mb-2"
                  style={{ fontSize: "0.72rem" }}
                >
                  {GENRE_LABELS[movie.genre]}
                </span>
                <h2
                  className="text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 700 }}
                >
                  {movie.title}
                </h2>
              </div>
            </>
          )}
        </div>

        <div className="p-6 pt-4">
          <div className="flex flex-wrap gap-5 mb-5 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={15} />
              {movie.year}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Globe size={15} />
              {movie.idioma}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Subtitles size={15} />
              {tracks.length > 0
                ? `Legendas: ${tracks.map((t: SubtitleTrack) => t.language_label).join(", ")}`
                : movie.status === "PROCESSING"
                  ? "Legendas sendo processadas..."
                  : "Sem legendas"
              }
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "0.95rem" }}>
            {movie.description}
          </p>
        </div>
      </div>
    </div>
  );
}
