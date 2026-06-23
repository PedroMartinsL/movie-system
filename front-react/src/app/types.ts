export type Genre = "ACTION" | "DRAMA" | "COMEDY" | "HORROR" | "ROMANCE" | "SCI_FI";

export type Idioma =
  | "Português"
  | "Inglês"
  | "Espanhol"
  | "Francês"
  | "Alemão"
  | "Italiano"
  | "Japonês"
  | "Coreano"
  | "Mandarim"
  | "Outro";

// Tipo unificado: compatível com o modelo do backend e com os componentes visuais
export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  imgUrl: string | null;
  videoUrl: string | null;
  description: string;
  idioma: string;
  legenda: string;
  // campos opcionais vindos da API
  status?: string;
  featured?: boolean;
  createdAt?: string;
}

export const GENRE_LABELS: Record<Genre, string> = {
  ACTION: "Ação",
  DRAMA: "Drama",
  COMEDY: "Comédia",
  HORROR: "Terror",
  ROMANCE: "Romance",
  SCI_FI: "Ficção Científica",
};

export const IDIOMA_OPTIONS: Idioma[] = [
  "Português",
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Japonês",
  "Coreano",
  "Mandarim",
  "Outro",
];
