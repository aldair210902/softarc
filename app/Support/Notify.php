<?php

namespace App\Support;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Collection;

class Notify
{
    /**
     * Notifica a todos los usuarios activos con al menos uno de los permisos.
     *
     * @param  list<string>  $abilities
     * @param  array<string, mixed>  $meta
     */
    public static function toPermission(array $abilities, string $type, string $title, ?string $body = null, ?string $link = null, array $meta = [], ?int $exceptUserId = null): int
    {
        $users = User::query()
            ->where('status', 'Activo')
            ->get()
            ->filter(function (User $user) use ($abilities) {
                foreach ($abilities as $ability) {
                    if ($user->canAccess($ability)) {
                        return true;
                    }
                }

                return false;
            });

        return self::toUsers($users, $type, $title, $body, $link, $meta, $exceptUserId);
    }

    /**
     * @param  Collection<int, User>|iterable<User>  $users
     * @param  array<string, mixed>  $meta
     */
    public static function toUsers(iterable $users, string $type, string $title, ?string $body = null, ?string $link = null, array $meta = [], ?int $exceptUserId = null): int
    {
        $count = 0;
        foreach ($users as $user) {
            if (! $user instanceof User) {
                continue;
            }
            if ($exceptUserId && (int) $user->id === $exceptUserId) {
                continue;
            }
            if (! $user->isActive()) {
                continue;
            }

            AppNotification::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'meta' => $meta ?: null,
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public static function toUser(User|int $user, string $type, string $title, ?string $body = null, ?string $link = null, array $meta = []): void
    {
        $id = $user instanceof User ? $user->id : $user;
        $model = $user instanceof User ? $user : User::query()->find($id);
        if (! $model || ! $model->isActive()) {
            return;
        }

        AppNotification::query()->create([
            'user_id' => $model->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
            'meta' => $meta ?: null,
        ]);
    }
}
