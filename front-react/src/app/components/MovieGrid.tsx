import type { Movie } from "../types";
import { GENRE_LABELS } from "../types";
import { Globe } from "lucide-react";

interface MovieGridProps {
  movies: Movie[];
  onSelect: (m: Movie) => void;
}

export function MovieGrid({ movies, onSelect }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Nenhum filme encontrado.
      </div>
    );
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: (m: Movie) => void }) {
  return (
    <button
      onClick={() => onSelect(movie)}
      className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary transition-all duration-300"
    >
      <div className="relative overflow-hidden" style={{ paddingBottom: "150%" }}>
        <img
          src={movie.imgUrl}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(10,10,11,0.9) 0%, transparent 50%)" }}
        />
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs"
          style={{ background: "rgba(10,10,11,0.85)", color: "var(--primary)", border: "1px solid var(--primary)", backdropFilter: "blur(4px)" }}
        >
          {GENRE_LABELS[movie.genre]}
        </div>
      </div>

      <div className="p-3">
        <h3
          className="text-foreground mb-1 truncate group-hover:text-primary transition-colors"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", fontWeight: 600 }}
        >
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: "0.78rem" }}>
          <span>{movie.year}</span>
          <span className="flex items-center gap-1">
            <Globe size={11} />
            {movie.idioma}
          </span>
        </div>
        {movie.legenda && movie.legenda !== "Sem legenda" && (
          <p className="text-muted-foreground mt-1" style={{ fontSize: "0.7rem" }}>
            Leg: {movie.legenda}
          </p>
        )}
      </div>
    </button>
  );
}
