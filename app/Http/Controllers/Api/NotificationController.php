<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $limit = min(50, max(1, (int) $request->query('limit', 20)));

        $items = AppNotification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (AppNotification $n) => $this->serialize($n));

        $unread = AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'items' => $items,
            'unread' => $unread,
        ]);
    }

    public function markRead(Request $request, AppNotification $notification)
    {
        abort_unless((int) $notification->user_id === (int) $request->user()->id, 403);
        $notification->markRead();

        return response()->json($this->serialize($notification->fresh()));
    }

    public function markAllRead(Request $request)
    {
        AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Ok']);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(AppNotification $n): array
    {
        return [
            'id' => (string) $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'body' => $n->body,
            'link' => $n->link,
            'meta' => $n->meta,
            'read' => $n->read_at !== null,
            'createdAt' => $n->created_at?->toISOString(),
            'createdAtHuman' => $n->created_at?->diffForHumans(),
        ];
    }
}
