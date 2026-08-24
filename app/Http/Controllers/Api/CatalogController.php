<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SaasProductResource;
use App\Models\SaasProduct;
use App\Support\Audit;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index()
    {
        return SaasProductResource::collection(
            SaasProduct::query()
                ->whereIn('status', ['Activo', 'Beta'])
                ->latest()
                ->get()
        );
    }

    /** Listado completo para panel admin (incluye Inactivo). */
    public function indexAll()
    {
        return SaasProductResource::collection(SaasProduct::query()->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
            'setupFee' => ['nullable', 'numeric', 'min:0'],
            'monthlyFee' => ['nullable', 'numeric', 'min:0'],
            'activeClients' => ['nullable', 'integer', 'min:0'],
            'techStack' => ['nullable', 'array'],
            'iconName' => ['nullable', 'string', 'max:100'],
            'imageUrls' => ['nullable', 'array'],
            'imageUrls.*' => ['string', 'max:1000'],
        ]);

        $product = SaasProduct::query()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'status' => $data['status'] ?? 'Activo',
            'setup_fee' => $data['setupFee'] ?? 0,
            'monthly_fee' => $data['monthlyFee'] ?? 0,
            'active_clients' => $data['activeClients'] ?? 0,
            'tech_stack' => $data['techStack'] ?? [],
            'icon_name' => $data['iconName'] ?? 'Box',
            'image_urls' => $data['imageUrls'] ?? [],
        ]);

        Audit::log('Producto SaaS creado', 'Catálogo', ['id' => $product->id]);

        return (new SaasProductResource($product))->response()->setStatusCode(201);
    }

    public function update(Request $request, SaasProduct $catalog)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'string', 'max:50'],
            'setupFee' => ['nullable', 'numeric', 'min:0'],
            'monthlyFee' => ['nullable', 'numeric', 'min:0'],
            'activeClients' => ['nullable', 'integer', 'min:0'],
            'techStack' => ['nullable', 'array'],
            'iconName' => ['nullable', 'string', 'max:100'],
            'imageUrls' => ['nullable', 'array'],
            'imageUrls.*' => ['string', 'max:1000'],
        ]);

        $catalog->update([
            'name' => $data['name'] ?? $catalog->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $catalog->description,
            'category' => $data['category'] ?? $catalog->category,
            'status' => $data['status'] ?? $catalog->status,
            'setup_fee' => $data['setupFee'] ?? $catalog->setup_fee,
            'monthly_fee' => $data['monthlyFee'] ?? $catalog->monthly_fee,
            'active_clients' => $data['activeClients'] ?? $catalog->active_clients,
            'tech_stack' => array_key_exists('techStack', $data) ? $data['techStack'] : $catalog->tech_stack,
            'icon_name' => $data['iconName'] ?? $catalog->icon_name,
            'image_urls' => array_key_exists('imageUrls', $data) ? $data['imageUrls'] : $catalog->image_urls,
        ]);

        Audit::log('Producto SaaS actualizado', 'Catálogo', ['id' => $catalog->id]);

        return new SaasProductResource($catalog);
    }

    public function destroy(SaasProduct $catalog)
    {
        $catalog->delete();

        Audit::log('Producto SaaS eliminado', 'Catálogo', ['id' => $catalog->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
