<?php

namespace App\Support;

class RolePermissions
{
    public const ALL = '*';

    /**
     * @return list<string>
     */
    public static function forRole(?string $role): array
    {
        $role = trim((string) $role);

        if (in_array($role, ['Super Admin', 'Administrador'], true)) {
            return [self::ALL];
        }

        return match ($role) {
            'Soporte' => [
                'dashboard.view',
                'clients.view',
                'projects.view',
                'tickets.manage',
                'servers.view',
                'domains.view',
                'wiki.manage',
                'profile.manage',
            ],
            'Ventas' => [
                'dashboard.view',
                'crm.manage',
                'clients.manage',
                'projects.manage',
                'finances.view',
                'catalog.view',
                'wiki.view',
                'profile.manage',
            ],
            default => [
                'dashboard.view',
                'wiki.view',
                'tickets.view',
                'profile.manage',
            ],
        };
    }

    /**
     * @param  list<string>|null  $custom
     * @return list<string>
     */
    public static function resolve(?string $role, ?array $custom = null): array
    {
        if (is_array($custom) && in_array('all', $custom, true)) {
            return [self::ALL];
        }

        $fromRole = self::forRole($role);

        if ($fromRole === [self::ALL]) {
            return $fromRole;
        }

        if (! is_array($custom) || $custom === []) {
            return $fromRole;
        }

        return array_values(array_unique([...$fromRole, ...$custom]));
    }

    /**
     * @param  list<string>  $permissions
     */
    public static function allows(array $permissions, string $ability): bool
    {
        if (in_array(self::ALL, $permissions, true)) {
            return true;
        }

        if (in_array($ability, $permissions, true)) {
            return true;
        }

        // "foo.manage" implica "foo.view"
        [$module] = array_pad(explode('.', $ability, 2), 2, null);
        if ($module && str_ends_with($ability, '.view') && in_array("{$module}.manage", $permissions, true)) {
            return true;
        }

        return false;
    }
}
