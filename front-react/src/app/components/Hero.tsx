import { Play, Globe, Subtitles } from "lucide-react";
import type { Movie } from "../types";
import { GENRE_LABELS } from "../types";

interface HeroProps {
  movie: Movie;
  onSelect: (m: Movie) => void;
}

export function Hero({ movie, onSelect }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "520px" }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie.imgUrl})`,
          filter: "blur(2px) brightness(0.3)",
          transform: "scale(1.05)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(10,10,11,0.95) 40%, rgba(10,10,11,0.2) 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(10,10,11,1) 0%, transparent 40%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-20 flex items-center" style={{ minHeight: "520px" }}>
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="px-2 py-0.5 rounded text-xs border border-primary text-primary"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              EM DESTAQUE
            </span>
            <span className="text-muted-foreground text-xs">{GENRE_LABELS[movie.genre]}</span>
          </div>

          <h1
            className="text-foreground mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            {movie.title}
          </h1>

          <div className="flex items-center gap-4 mb-5 text-sm text-muted-foreground">
            <span>{movie.year}</span>
            <span className="flex items-center gap-1">
              <Globe size={14} />
              {movie.idioma}
            </span>
            {movie.legenda && movie.legenda !== "Sem legenda" && (
              <span className="flex items-center gap-1">
                <Subtitles size={14} />
                Leg: {movie.legenda}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontSize: "0.95rem", maxWidth: "460px" }}>
            {movie.description}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => onSelect(movie)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ fontWeight: 500 }}
            >
              <Play size={16} fill="currentColor" />
              Ver Detalhes
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-xl opacity-30"
              style={{ background: "linear-gradient(135deg, var(--primary), transparent)" }}
            />
            <img
              src={movie.imgUrl}
              alt={movie.title}
              className="relative rounded-xl object-cover shadow-2xl"
              style={{ width: "220px", height: "330px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
