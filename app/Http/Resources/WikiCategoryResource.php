<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WikiCategory */
class WikiCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'articles' => $this->whenLoaded('articles', function () {
                return $this->articles->map(fn ($a) => [
                    'id' => (string) $a->id,
                    'title' => $a->title,
                ]);
            }),
        ];
    }
}
