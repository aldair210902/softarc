<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WikiArticle */
class WikiArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'categoryId' => (string) $this->wiki_category_id,
            'title' => $this->title,
            'author' => $this->author ?? '',
            'updatedAt' => $this->updated_at?->toDateString(),
            'tags' => $this->tags ?? [],
            'content' => $this->content ?? '',
        ];
    }
}
