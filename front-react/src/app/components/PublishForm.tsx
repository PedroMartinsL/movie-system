import { useState } from "react";
import { Film, ArrowLeft, Upload } from "lucide-react";
import type { Movie, Genre, Idioma } from "../types";
import { GENRE_LABELS, IDIOMA_OPTIONS } from "../types";

interface PublishFormProps {
  onPublish: (movie: Movie) => void;
  onCancel: () => void;
}

const GENRE_ENTRIES = Object.entries(GENRE_LABELS) as [Genre, string][];

export function PublishForm({ onPublish, onCancel }: PublishFormProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [genre, setGenre] = useState<Genre | "">("");
  const [imgUrl, setImgUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [idioma, setIdioma] = useState<Idioma | "">("");
  const [legenda, setLegenda] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título obrigatório";
    if (!genre) e.genre = "Selecione um gênero";
    if (!description.trim()) e.description = "Descrição obrigatória";
    if (!idioma) e.idioma = "Selecione um idioma";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const movie: Movie = {
      id: Date.now().toString(),
      title: title.trim(),
      year: parseInt(year),
      genre: genre as Genre,
      imgUrl: imgUrl.trim() || "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&h=600&auto=format",
      videoUrl: videoUrl.trim() || "",
      description: description.trim(),
      idioma: idioma as Idioma,
      legenda: legenda.trim() || "Sem legenda",
    };

    setSubmitted(true);
    setTimeout(() => onPublish(movie), 1000);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
          <Film size={28} style={{ color: "var(--primary-foreground)" }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-foreground">
          Filme Publicado!
        </h2>
        <p className="text-muted-foreground text-sm">Redirecionando para o catálogo...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
      >
        <ArrowLeft size={16} />
        Voltar para o catálogo
      </button>

      <div className="mb-8">
        <h1 className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Publicar Filme
        </h1>
        <p className="text-muted-foreground text-sm">
          Preencha os dados do filme para adicioná-lo ao catálogo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Título */}
        <Field label="Título *" error={errors.title}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do filme"
            className={inputCls(!!errors.title)}
          />
        </Field>

        {/* Ano */}
        <Field label="Ano de Lançamento">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1888}
            max={2030}
            className={inputCls(false)}
          />
        </Field>

        {/* Gênero — enum select */}
        <Field label="Gênero *" error={errors.genre}>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className={inputCls(!!errors.genre)}
          >
            <option value="" disabled>Selecione o gênero</option>
            {GENRE_ENTRIES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>

        {/* Idioma — select */}
        <Field label="Idioma *" error={errors.idioma}>
          <select
            value={idioma}
            onChange={(e) => setIdioma(e.target.value as Idioma)}
            className={inputCls(!!errors.idioma)}
          >
            <option value="" disabled>Selecione o idioma</option>
            {IDIOMA_OPTIONS.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </Field>

        {/* Legenda */}
        <Field label="Legenda">
          <input
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Ex: Português, Inglês, Sem legenda"
            className={inputCls(false)}
          />
        </Field>

        {/* Descrição */}
        <Field label="Descrição *" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a história do filme..."
            rows={4}
            className={`${inputCls(!!errors.description)} resize-none`}
          />
        </Field>

        {/* imgUrl */}
        <Field label="URL da Imagem (Pôster)">
          <input
            type="url"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://... (opcional)"
            className={inputCls(false)}
          />
          {imgUrl && (
            <img
              src={imgUrl}
              alt="preview"
              className="mt-2 w-20 h-28 object-cover rounded-lg border border-border"
            />
          )}
        </Field>

        {/* videoUrl */}
        <Field label="URL do Vídeo">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://... (opcional)"
            className={inputCls(false)}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
            style={{ fontWeight: 500 }}
          >
            <Upload size={16} />
            Publicar no Catálogo
          </button>
        </div>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-lg border text-foreground text-sm focus:outline-none transition-colors bg-secondary placeholder:text-muted-foreground ${
    hasError ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-sm" style={{ fontWeight: 500 }}>{label}</label>
      {children}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
