import { useState, useEffect } from "react";
import { MovieGrid } from "./components/MovieGrid";
import { PublishForm } from "./components/PublishForm";
import { MovieModal } from "./components/MovieModal";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { ProfilePage } from "./pages/Profile";
import { ChoosePlanPage } from "./pages/ChoosePlan";
import { useAuth } from "../context/AuthContext";
import { catalog, Movie } from "../services/api";
import { GENRE_LABELS } from "./types";

type Page = "home" | "publish" | "login" | "register" | "profile";

export default function App() {
  const { user, loading: authLoading, logout, loginWithTokens } = useAuth();
  const [page, setPage] = useState<Page>("home");
  const [showPlans, setShowPlans] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeGenre, setActiveGenre] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (accessToken && refreshToken) {
      window.history.replaceState({}, "", "/");
      loginWithTokens(accessToken, refreshToken).catch(console.error);
    }
  }, []);

  function handleNavigate(p: "home" | "publish") {
    if (p === "publish" && !user) {
      setPage("login");
      return;
    }
    setPage(p);
  }

  useEffect(() => {
    if (!user) return;
    setLoadingMovies(true);
    catalog
      .list({
        search: searchQuery || undefined,
        genre: activeGenre !== "ALL" ? activeGenre : undefined,
      })
      .then((res) => setMovies(res.data))
      .catch(console.error)
      .finally(() => setLoadingMovies(false));
  }, [user, searchQuery, activeGenre]);

  function handlePublish(movie: Movie) {
    setMovies((prev) => [movie, ...prev]);
    setPage("home");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (showPlans) {
    return <ChoosePlanPage onSuccess={() => { setShowPlans(false); setPage("home"); }} />;
  }

  if (!user) {
    if (page === "register") {
      return (
        <RegisterPage
          onNavigateLogin={() => setPage("login")}
          onSuccess={() => setShowPlans(true)}
        />
      );
    }
    return (
      <LoginPage
        onNavigateRegister={() => setPage("register")}
        onSuccess={() => setPage("home")}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Navbar
        page={page as "home" | "publish"}
        onNavigate={handleNavigate}
        onNavigateProfile={() => setPage("profile")}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        user={user}
        onLogout={logout}
      />

      {page === "home" && (
        <>
          {movies[0] && (
            <Hero movie={movies[0] as any} onSelect={(m) => setSelectedMovie(m as Movie)} />
          )}
          <main className="max-w-7xl mx-auto px-4 py-12">
            <GenreFilter active={activeGenre} onChange={setActiveGenre} />

            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Catálogo
                <span
                  className="text-muted-foreground ml-2"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                  }}
                >
                  ({movies.length})
                </span>
              </h2>
            </div>

            {loadingMovies ? (
              <p className="text-muted-foreground text-sm">Carregando filmes...</p>
            ) : (
              <MovieGrid
                movies={movies as any}
                onSelect={(m) => setSelectedMovie(m as Movie)}
              />
            )}
          </main>
        </>
      )}

      {page === "profile" && (
        <ProfilePage onBack={() => setPage("home")} />
      )}

      {showPlans && (
        <ChoosePlanPage onSuccess={() => { setShowPlans(false); setPage("home"); }} />
      )}

      {page === "publish" && (
        <main className="max-w-3xl mx-auto px-4 py-16">
          <PublishForm onPublish={handlePublish} onCancel={() => setPage("home")} />
        </main>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie as any}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

const ALL_GENRES: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "Todos" },
  ...Object.entries(GENRE_LABELS).map(([key, label]) => ({ key, label })),
];

function GenreFilter({
  active,
  onChange,
}: {
  active: string;
  onChange: (g: string) => void;
}) {
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
