<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'SoftArc') }}</title>

        <script>
            (function () {
                try {
                    var key = 'softarc-theme';
                    var pref = localStorage.getItem(key) || 'system';
                    var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    document.documentElement.classList.toggle('dark', dark);
                    document.documentElement.classList.toggle('light', !dark);
                    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {}
            })();
        </script>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        @vite(['resources/js/src/main.tsx'])
        <script>
            window.__APP_BASE__ = @json(rtrim(request()->getBasePath(), '/'));
        </script>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
