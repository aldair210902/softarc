import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, Folder, FileText, ChevronRight, ChevronDown, Clock, User, Hash,
  Pencil, Trash2, BookText, Code2, ListOrdered, Type, GitCommit, Boxes, Sparkles, Server,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { apiGet, apiMutate } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { useAuth } from '../../context/AuthContext';
import { WikiContent } from '../../components/wiki/WikiContent';

interface WikiCategory {
  id: string;
  name: string;
  articles: { id: string; title: string }[];
}

interface WikiArticle {
  id: string;
  categoryId: string;
  title: string;
  author: string;
  updatedAt: string;
  tags: string[];
  content: string;
}

const CATEGORY_META: { match: RegExp; icon: typeof Folder; tone: string }[] = [
  { match: /paso|flujo|trabajo/i, icon: ListOrdered, tone: 'text-cyan-400' },
  { match: /laravel|php|backend/i, icon: Code2, tone: 'text-red-400' },
  { match: /react|frontend|ai.?studio|cursor/i, icon: Sparkles, tone: 'text-sky-400' },
  { match: /git|commit/i, icon: GitCommit, tone: 'text-orange-400' },
  { match: /librer|packag|dependenc/i, icon: Boxes, tone: 'text-violet-400' },
  { match: /operac|backup|soporte/i, icon: Server, tone: 'text-emerald-400' },
  { match: /desarroll|deploy/i, icon: Code2, tone: 'text-blue-400' },
];

function categoryVisual(name: string) {
  return CATEGORY_META.find((m) => m.match.test(name)) || { icon: Folder, tone: 'text-blue-400' };
}

const ARTICLE_TEMPLATES: { id: string; label: string; title: string; tags: string; content: string }[] = [
  {
    id: 'blank',
    label: 'En blanco',
    title: '',
    tags: '',
    content: '',
  },
  {
    id: 'laravel',
    label: 'Laravel',
    title: 'Crear proyecto Laravel',
    tags: 'laravel, setup',
    content: `## Objetivo
Crear un proyecto Laravel listo para trabajar en local.

## Pasos
1. Abrir terminal en la carpeta de proyectos.
2. Ejecutar el comando de creación.
3. Entrar al proyecto e instalar dependencias frontend si aplica.

\`\`\`bash title:Crear proyecto
composer create-project laravel/laravel nombre-proyecto
cd nombre-proyecto
\`\`\`

\`\`\`bash title:Servidor local
php artisan serve
\`\`\`

> Tip: copia cada bloque con el botón Copiar.
`,
  },
  {
    id: 'react-cursor',
    label: 'React → Cursor',
    title: 'De Google AI Studio a Cursor',
    tags: 'react, ai-studio, cursor',
    content: `## Objetivo
Pasar un prototipo de Google AI Studio a un proyecto editable en Cursor.

## Pasos
1. Exportar o copiar el código desde AI Studio.
2. Crear el proyecto React en local.
3. Abrir la carpeta en Cursor y pegar/adaptar el código.

\`\`\`bash title:Crear app Vite + React + TS
npm create vite@latest mi-app -- --template react-ts
cd mi-app
npm install
\`\`\`

\`\`\`bash title:Abrir en Cursor
cursor .
\`\`\`
`,
  },
  {
    id: 'commits',
    label: 'Commits',
    title: 'Mensajes de commit útiles',
    tags: 'git, commits',
    content: `## Convención rápida
Usa prefijos claros: feat, fix, docs, refactor, chore.

\`\`\`text title:Ejemplos listos para pegar
feat: agregar módulo de clientes
fix: corregir login en modo claro
docs: actualizar guía de deploy
refactor: limpiar formularios del admin
chore: actualizar dependencias
\`\`\`
`,
  },
];

export default function Wiki() {
  const { user } = useAuth();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [form, setForm] = useState({ categoryId: '', title: '', tags: '', content: '' });
  const [loading, setLoading] = useState(true);

  const loadCategories = (preferArticleId?: string | null) => {
    setLoading(true);
    apiGet<WikiCategory[]>('/api/wiki/categories')
      .then((cats) => {
        const list = Array.isArray(cats) ? cats : [];
        setCategories(list);
        const nextId = preferArticleId === undefined
          ? (activeArticleId || list[0]?.articles?.[0]?.id || null)
          : preferArticleId;
        setActiveArticleId(nextId);
        const expand: Record<string, boolean> = {};
        list.forEach((c) => { expand[c.id] = true; });
        setExpandedCategories((prev) => ({ ...expand, ...prev }));
        if (list[0]) {
          setForm((f) => (f.categoryId ? f : { ...f, categoryId: list[0].id }));
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const insertAtCursor = (snippet: string) => {
    const el = contentRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: `${f.content}${f.content ? '\n\n' : ''}${snippet}` }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = form.content.slice(0, start);
    const after = form.content.slice(end);
    const next = `${before}${snippet}${after}`;
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const applyTemplate = (id: string) => {
    const t = ARTICLE_TEMPLATES.find((x) => x.id === id);
    if (!t || id === 'blank') return;
    setForm((f) => ({
      ...f,
      title: f.title || t.title,
      tags: f.tags || t.tags,
      content: t.content,
    }));
  };

  const openCreateArticle = () => {
    if (categories.length === 0) {
      setCategoryModalOpen(true);
      return;
    }
    setEditingId(null);
    setForm({
      categoryId: categories[0]?.id || '',
      title: '',
      tags: '',
      content: '',
    });
    setArticleModalOpen(true);
  };

  const openEdit = (article: WikiArticle) => {
    setEditingId(article.id);
    setForm({
      categoryId: article.categoryId,
      title: article.title,
      tags: (article.tags || []).join(', '),
      content: article.content || '',
    });
    setArticleModalOpen(true);
  };

  const closeArticleModal = () => {
    setArticleModalOpen(false);
    setEditingId(null);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiMutate<{ id: string }>('post', '/api/wiki/categories', {
        name: categoryName,
      });
      setCategoryModalOpen(false);
      setCategoryName('');
      setForm((f) => ({ ...f, categoryId: created.id }));
      loadCategories();
      setExpandedCategories((prev) => ({ ...prev, [created.id]: true }));
    } finally {
      setSubmitting(false);
    }
  };

  const saveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title,
        author: user?.name || 'Admin',
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        content: form.content,
      };
      if (editingId) {
        await apiMutate('put', `/api/wiki/articles/${editingId}`, payload);
        closeArticleModal();
        loadCategories(editingId);
        setActiveArticleId(editingId);
        apiGet<WikiArticle>(`/api/wiki/articles/${editingId}`).then(setActiveArticle).catch(() => null);
      } else {
        const created = await apiMutate<{ id: string }>('post', '/api/wiki/articles', payload);
        closeArticleModal();
        loadCategories(created.id);
      }
      setExpandedCategories((prev) => ({ ...prev, [form.categoryId]: true }));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteArticle = async (article: WikiArticle) => {
    if (!window.confirm(`¿Eliminar el artículo "${article.title}"?`)) return;
    await apiMutate('delete', `/api/wiki/articles/${article.id}`);
    setActiveArticle(null);
    loadCategories(null);
  };

  useEffect(() => {
    if (!activeArticleId) {
      setActiveArticle(null);
      return;
    }
    apiGet<WikiArticle>(`/api/wiki/articles/${activeArticleId}`)
      .then(setActiveArticle)
      .catch(() => setActiveArticle(null));
  }, [activeArticleId]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        articles: (c.articles || []).filter((a) => a.title.toLowerCase().includes(q)),
      }))
      .filter((c) => (c.articles?.length || 0) > 0 || c.name.toLowerCase().includes(q));
  }, [categories, searchTerm]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalArticles = categories.reduce((n, c) => n + (c.articles?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Wiki & Procedimientos</h1>
          <p className="text-sm text-sa-faint mt-1">
            Guías por bloques: copia comandos, commits y snippets sin pelear con el formato.
          </p>
        </div>
        <Can ability="wiki.manage">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => setCategoryModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-sa-muted border border-sa-border hover:bg-sa-border/50 hover:text-sa-text transition-colors">
              <Folder className="h-4 w-4" />
              Nueva categoría
            </button>
            <button type="button" onClick={openCreateArticle} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
              <Plus className="h-4 w-4" />
              Nuevo artículo
            </button>
          </div>
        </Can>
      </div>

      <FormModal open={categoryModalOpen} title="Nueva categoría" onClose={() => setCategoryModalOpen(false)} onSubmit={saveCategory} submitting={submitting} submitLabel="Crear">
        <Field label="Nombre">
          <input required className={inputClass} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Laravel, React / Cursor, Git…" />
        </Field>
      </FormModal>

      <FormModal open={articleModalOpen} title={editingId ? 'Editar artículo' : 'Nuevo artículo'} onClose={closeArticleModal} onSubmit={saveArticle} submitting={submitting} submitLabel={editingId ? 'Guardar cambios' : 'Publicar'} wide>
        {!editingId && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint">Plantilla rápida</p>
            <div className="flex flex-wrap gap-2">
              {ARTICLE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sa-border text-sa-muted hover:text-sa-text hover:bg-sa-border/50 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Field label="Categoría">
          <select required className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="" disabled>Seleccionar...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Título"><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Tags (separados por coma)"><input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="laravel, git, cursor" /></Field>
        <Field label="Contenido">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={() => insertAtCursor('\n## Sección\n\n')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-sa-border text-sa-muted hover:text-sa-text hover:bg-sa-border/50"
            >
              <Type className="h-3 w-3" /> Título
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n1. Paso uno\n2. Paso dos\n3. Paso tres\n')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-sa-border text-sa-muted hover:text-sa-text hover:bg-sa-border/50"
            >
              <ListOrdered className="h-3 w-3" /> Pasos
            </button>
            <button
              type="button"
              onClick={() => insertAtCursor('\n```bash title:Nombre del comando desc:Para qué: … Cuándo: …\n# pega aquí\n```\n')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-sa-border text-sa-muted hover:text-sa-text hover:bg-sa-border/50"
            >
              <Code2 className="h-3 w-3" /> Bloque copiable
            </button>
          </div>
          <textarea
            ref={contentRef}
            required
            rows={14}
            className={cn(inputClass, 'font-mono text-[13px] leading-relaxed')}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={'## Título\n\nTexto...\n\n```bash title:Nombre desc:Para qué: … Cuándo: …\ncomando\n```'}
          />
          <p className="text-[11px] text-sa-faint mt-1.5">
            Usa <code className="text-sa-muted">##</code> para secciones y{' '}
            <code className="text-sa-muted">```bash title:Nombre desc:Para qué / cuándo</code> para bloques con Copiar.
          </p>
        </Field>
      </FormModal>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sa-faint" />
        <input
          type="text"
          placeholder="Buscar por título o categoría…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <aside className="w-full lg:w-[22rem] bg-sa-panel border border-sa-border rounded-2xl flex flex-col shrink-0 overflow-hidden min-h-[320px]">
          <div className="p-4 border-b border-sa-border flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-sa-faint uppercase tracking-wider">Índice</h3>
              <p className="text-[11px] text-sa-faint mt-0.5">{categories.length} bloques · {totalArticles} guías</p>
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1 p-3">
            {loading ? (
              <p className="text-sm text-sa-faint p-4 text-center">Cargando wiki...</p>
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                icon={BookText}
                title="Wiki vacía"
                description="Crea una categoría y luego publica tu primer procedimiento."
                action={
                  <Can ability="wiki.manage">
                    <button type="button" onClick={() => setCategoryModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                      Crear categoría
                    </button>
                  </Can>
                }
              />
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category) => {
                  const isExpanded = expandedCategories[category.id];
                  const visual = categoryVisual(category.name);
                  const Icon = visual.icon;
                  const count = category.articles?.length || 0;
                  return (
                    <div key={category.id} className="rounded-xl border border-sa-border/80 bg-sa-canvas/30 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center gap-2.5 p-3 text-sm font-semibold text-sa-text hover:bg-sa-border/40 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-sa-faint shrink-0" /> : <ChevronRight className="h-4 w-4 text-sa-faint shrink-0" />}
                        <Icon className={cn('h-4 w-4 shrink-0', visual.tone)} />
                        <span className="truncate flex-1 text-left">{category.name}</span>
                        <span className="text-[10px] font-bold text-sa-faint bg-sa-border/60 px-1.5 py-0.5 rounded-md">{count}</span>
                      </button>
                      {isExpanded && (
                        <div className="px-2 pb-2 space-y-0.5">
                          {count === 0 ? (
                            <p className="text-[11px] text-sa-faint px-3 py-2">Sin artículos</p>
                          ) : (
                            (category.articles || []).map((article) => {
                              const isActive = activeArticleId === article.id;
                              return (
                                <button
                                  type="button"
                                  key={article.id}
                                  onClick={() => setActiveArticleId(article.id)}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg transition-colors text-left',
                                    isActive ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-sa-muted hover:bg-sa-border/50 hover:text-sa-text',
                                  )}
                                >
                                  <FileText className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-blue-400' : 'text-sa-faint')} />
                                  <span className="truncate">{article.title}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 bg-sa-panel border border-sa-border rounded-2xl flex flex-col overflow-hidden min-h-[320px]">
          {!activeArticle ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={FileText}
                title="Selecciona una guía"
                description="Elige un documento del índice. Los comandos aparecen en bloques con botón Copiar."
              />
            </div>
          ) : (
            <>
              <div className="p-6 md:p-8 border-b border-sa-border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-extrabold text-sa-text tracking-tight">{activeArticle.title}</h2>
                  <Can ability="wiki.manage">
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => openEdit(activeArticle)} title="Editar" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => deleteArticle(activeArticle)} className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 border border-red-500/20" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Can>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-sa-faint">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{activeArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>Actualizado: {activeArticle.updatedAt}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(activeArticle.tags || []).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sa-border text-sa-muted border border-sa-border-strong">
                        <Hash className="h-3 w-3 mr-0.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                <WikiContent content={activeArticle.content || ''} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
