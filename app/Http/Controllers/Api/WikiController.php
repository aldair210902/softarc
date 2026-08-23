<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WikiArticleResource;
use App\Http\Resources\WikiCategoryResource;
use App\Models\WikiArticle;
use App\Models\WikiCategory;
use App\Support\Audit;
use Illuminate\Http\Request;

class WikiController extends Controller
{
    public function categories()
    {
        return WikiCategoryResource::collection(
            WikiCategory::query()->with(['articles' => fn ($q) => $q->orderBy('title')])->orderBy('sort')->get()
        );
    }

    public function showArticle(WikiArticle $article)
    {
        return new WikiArticleResource($article);
    }

    public function storeArticle(Request $request)
    {
        $data = $request->validate([
            'categoryId' => ['required', 'exists:wiki_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'content' => ['nullable', 'string'],
        ]);

        $article = WikiArticle::query()->create([
            'wiki_category_id' => $data['categoryId'],
            'title' => $data['title'],
            'author' => $data['author'] ?? auth()->user()?->name,
            'tags' => $data['tags'] ?? [],
            'content' => $data['content'] ?? '',
        ]);

        Audit::log('Artículo wiki creado', 'Wiki', ['id' => $article->id, 'title' => $article->title]);

        return (new WikiArticleResource($article))->response()->setStatusCode(201);
    }

    public function updateArticle(Request $request, WikiArticle $article)
    {
        $data = $request->validate([
            'categoryId' => ['sometimes', 'exists:wiki_categories,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'content' => ['nullable', 'string'],
        ]);

        $article->update([
            'wiki_category_id' => $data['categoryId'] ?? $article->wiki_category_id,
            'title' => $data['title'] ?? $article->title,
            'author' => array_key_exists('author', $data) ? $data['author'] : $article->author,
            'tags' => array_key_exists('tags', $data) ? $data['tags'] : $article->tags,
            'content' => array_key_exists('content', $data) ? $data['content'] : $article->content,
        ]);

        Audit::log('Artículo wiki actualizado', 'Wiki', ['id' => $article->id]);

        return new WikiArticleResource($article);
    }

    public function destroyArticle(WikiArticle $article)
    {
        $article->delete();
        Audit::log('Artículo wiki eliminado', 'Wiki', ['id' => $article->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = WikiCategory::query()->create([
            'name' => $data['name'],
            'sort' => $data['sort'] ?? 0,
        ]);

        return (new WikiCategoryResource($category->load('articles')))->response()->setStatusCode(201);
    }
}
