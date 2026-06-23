import { Film, Search, PlusCircle, Home, LogOut } from "lucide-react";
import type { AuthUser } from "../../services/api";

type Page = "home" | "publish";

interface NavbarProps {
  page: Page;
  onNavigate: (p: Page) => void;
  onNavigateProfile: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export function Navbar({ page, onNavigate, onNavigateProfile, searchQuery, onSearch, user, onLogout }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: "rgba(10,10,11,0.92)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 shrink-0"
        >
          <Film className="text-primary" size={22} />
          <span
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--primary)", fontSize: "1.2rem", fontWeight: 600 }}
          >
            CineVault
          </span>
        </button>

        {page === "home" && (
          <div className="flex-1 max-w-sm relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar filmes..."
              className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        <nav className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              page === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home size={16} />
            <span className="hidden sm:inline">Início</span>
          </button>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => onNavigate("publish")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                page === "publish"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              <PlusCircle size={16} />
              <span>Publicar Filme</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={onNavigateProfile}
                className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {user.name}
                {user.role === "ADMIN" && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">ADMIN</span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
