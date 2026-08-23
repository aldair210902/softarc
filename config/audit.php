<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Retención de auditoría
    |--------------------------------------------------------------------------
    |
    | Los registros más antiguos que estos días se eliminan con
    | `php artisan audit:prune` (programado a diario).
    |
    */
    'retention_days' => (int) env('AUDIT_RETENTION_DAYS', 90),

    /*
    | Si es true, los eventos "critical" no se borran por antigüedad.
    */
    'keep_critical' => filter_var(env('AUDIT_KEEP_CRITICAL', true), FILTER_VALIDATE_BOOL),

    /*
    | Tope de seguridad: si hay más filas, se borran las más antiguas
    | (respetando keep_critical) hasta quedar bajo este límite.
    */
    'max_rows' => (int) env('AUDIT_MAX_ROWS', 50000),

    /*
    | Tamaño máximo del JSON de detalles al guardar (caracteres).
    */
    'max_details_chars' => (int) env('AUDIT_MAX_DETAILS_CHARS', 2000),

];
