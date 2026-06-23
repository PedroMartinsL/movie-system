import { useState, type FormEvent, type ReactNode } from "react";
import { Film, ArrowLeft, Upload } from "lucide-react";
import type { Movie, Genre, Idioma } from "../types";
import { GENRE_LABELS, IDIOMA_OPTIONS } from "../types";
import { catalog, storage } from "../../services/api";

interface PublishFormProps {
  onPublish: (movie: Movie) => void;
  onCancel: () => void;
}

const GENRE_ENTRIES = Object.entries(GENRE_LABELS) as [Genre, string][];

export function PublishForm({ onPublish, onCancel }: PublishFormProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [genre, setGenre] = useState<Genre | "">("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [description, setDescription] = useState("");
  const [idioma, setIdioma] = useState<Idioma | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título obrigatório";
    if (!genre) e.genre = "Selecione um gênero";
    if (!description.trim()) e.description = "Descrição obrigatória";
    if (!idioma) e.idioma = "Selecione um idioma";
    if (!posterFile) e.posterFile = "Selecione a imagem do pôster";
    if (!videoFile) e.videoFile = "Selecione o arquivo do filme";
    return e;
  }

  function handlePosterChange(file: File | null) {
    setPosterFile(file);
    setPosterPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!posterFile || !videoFile) return;

    setLoading(true);
    setErrors({});
    try {
      // 1. Cria o registro do filme no catálogo
      const movie = await catalog.create({
        title: title.trim(),
        description: description.trim(),
        year: parseInt(year),
        genre: genre as string,
        idioma: idioma as string,
        featured: false,
      });

      // 2. Faz upload do poster e do vídeo em paralelo
      await Promise.all([
        storage.uploadPoster(movie.id, posterFile),
        storage.uploadVideo(movie.id, videoFile),
      ]);

      // 3. Atualiza o catálogo marcando que poster e vídeo existem
      const updated = await catalog.update(movie.id, {
        posterId: movie.id,
        videoId: movie.id,
      } as any);

      setSubmitted(true);
      setTimeout(() => onPublish(updated), 1000);
    } catch (err: any) {
      setErrors({ _: err.message || "Erro ao publicar filme. Tente novamente." });
    } finally {
      setLoading(false);
    }
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
        {errors._ && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {errors._}
          </div>
        )}

        <Field label="Título *" error={errors.title}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do filme"
            className={inputCls(!!errors.title)}
          />
        </Field>

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

        <Field label="Descrição *" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a história do filme..."
            rows={4}
            className={`${inputCls(!!errors.description)} resize-none`}
          />
        </Field>

        <Field label="Imagem do Pôster *" error={errors.posterFile}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePosterChange(e.target.files?.[0] ?? null)}
            className={inputCls(!!errors.posterFile)}
          />
          {posterPreview && (
            <img
              src={posterPreview}
              alt="preview"
              className="mt-2 w-20 h-28 object-cover rounded-lg border border-border"
            />
          )}
        </Field>

        <Field label="Arquivo do Filme *" error={errors.videoFile}>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className={inputCls(!!errors.videoFile)}
          />
          {videoFile && (
            <p className="text-muted-foreground text-xs">{videoFile.name}</p>
          )}
        </Field>

        {loading && (
          <p className="text-muted-foreground text-sm text-center">
            Enviando filme... isso pode levar alguns instantes.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm disabled:opacity-60"
            style={{ fontWeight: 500 }}
          >
            <Upload size={16} />
            {loading ? "Publicando..." : "Publicar no Catálogo"}
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

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-foreground text-sm" style={{ fontWeight: 500 }}>{label}</label>
      {children}
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
