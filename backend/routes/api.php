<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{user}/messages', [ConversationController::class, 'messages']);
    Route::post('/conversations/{user}/messages', [ConversationController::class, 'store']);
    Route::post('/conversations/{user}/read', [ConversationController::class, 'markRead']);
});
