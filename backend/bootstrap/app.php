<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API-only app: do not redirect unauthenticated users to a login page.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON responses for API requests.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, \Throwable $e): bool =>
                $request->is('api/*') || $request->expectsJson()
        );

        // Return 401 instead of redirecting to a nonexistent login route.
        $exceptions->render(
            function (
                AuthenticationException $e,
                Request $request
            ) {
                if ($request->is('api/*') || $request->expectsJson()) {
                    return response()->json([
                        'message' => 'Unauthenticated.',
                    ], 401);
                }

                return null;
            }
        );
    })->create();
