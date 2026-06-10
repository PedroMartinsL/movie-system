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

export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: Genre;
  imgUrl: string;
  videoUrl: string;
  description: string;
  idioma: Idioma;
  legenda: string;
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
