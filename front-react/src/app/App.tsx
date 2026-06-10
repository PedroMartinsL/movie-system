import { useState } from "react";
import { MovieGrid } from "./components/MovieGrid";
import { PublishForm } from "./components/PublishForm";
import { MovieModal } from "./components/MovieModal";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import type { Movie } from "./types";

const INITIAL_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Horizonte Perdido",
    year: 2024,
    genre: "DRAMA",
    description:
      "Em uma cidade submersa pela névoa eterna, um detetive investigado pelo seu passado descobre que a última testemunha de um crime nunca existiu — ou talvez jamais tenha morrido.",
    imgUrl:
      "https://images.unsplash.com/photo-1743431267979-43ace055f121?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Português",
    legenda: "Inglês",
  },
  {
    id: "2",
    title: "Sombras do Amanhã",
    year: 2023,
    genre: "SCI_FI",
    description:
      "No ano 2087, uma soldada descobre que as memórias que guarda não são suas. Agora ela deve escolher entre a missão e a verdade.",
    imgUrl:
      "https://images.unsplash.com/photo-1633885274919-04b5af171f8c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Inglês",
    legenda: "Português",
  },
  {
    id: "3",
    title: "O Último Ato",
    year: 2024,
    genre: "HORROR",
    description:
      "Uma atriz de teatro é acusada de matar seu co-protagonista durante uma peça ao vivo. Mas as câmeras mostram algo impossível.",
    imgUrl:
      "https://images.unsplash.com/photo-1778372670061-e84b57764aec?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Português",
    legenda: "Sem legenda",
  },
  {
    id: "4",
    title: "Raízes do Caos",
    year: 2023,
    genre: "ACTION",
    description:
      "Uma família dividida pela guerra civil de um país fictício reconstrói sua história a partir de cartas enterradas há cinquenta anos.",
    imgUrl:
      "https://images.unsplash.com/photo-1629278357549-b413116d211c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Espanhol",
    legenda: "Português",
  },
  {
    id: "5",
    title: "Luz Negra",
    year: 2024,
    genre: "HORROR",
    description:
      "Uma família se muda para uma casa onde a iluminação elétrica nunca funciona depois da meia-noite. O que mora na escuridão aprende a se adaptar.",
    imgUrl:
      "https://images.unsplash.com/photo-1692553041081-6c4e2cbd30d7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Inglês",
    legenda: "Português",
  },
  {
    id: "6",
    title: "Cinema Paralelo",
    year: 2022,
    genre: "ROMANCE",
    description:
      "Dois projecionistas em salas de cinema opostas na mesma rua começam a se comunicar através dos filmes que exibem — sem nunca se encontrar pessoalmente.",
    imgUrl:
      "https://images.unsplash.com/photo-1762417419967-d5ccd2ebe463?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    idioma: "Francês",
    legenda: "Português",
  },
];

type Page = "home" | "publish";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeGenre, setActiveGenre] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMovies = movies.filter((m) => {
    const matchesGenre = activeGenre === "ALL" || m.genre === activeGenre;
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  function handlePublish(movie: Movie) {
    setMovies((prev) => [movie, ...prev]);
    setPage("home");
  }

  return (
    /* MARKER-MAKE-KIT-INVOKED */
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar
        page={page}
        onNavigate={setPage}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      {page === "home" && (
        <>
          <Hero movie={movies[0]} onSelect={setSelectedMovie} />
          <main className="max-w-7xl mx-auto px-4 py-12">
            <GenreFilter active={activeGenre} onChange={setActiveGenre} />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Catálogo
                <span className="text-muted-foreground ml-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}>
                  ({filteredMovies.length})
                </span>
              </h2>
            </div>

            <MovieGrid movies={filteredMovies} onSelect={setSelectedMovie} />
          </main>
        </>
      )}

      {page === "publish" && (
        <main className="max-w-3xl mx-auto px-4 py-16">
          <PublishForm onPublish={handlePublish} onCancel={() => setPage("home")} />
        </main>
      )}

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </div>
  );
}

import type { Genre } from "./types";
import { GENRE_LABELS } from "./types";

const ALL_GENRES: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "Todos" },
  ...Object.entries(GENRE_LABELS).map(([key, label]) => ({ key, label })),
];

function GenreFilter({ active, onChange }: { active: string; onChange: (g: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap mb-8">
      {ALL_GENRES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-full border text-sm transition-all duration-200 ${
            active === key
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
