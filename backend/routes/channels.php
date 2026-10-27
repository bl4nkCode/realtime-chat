<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

//public channel
Broadcast::channel('chat.global', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
    ];
});

//private channel
Broadcast::channel('chat.user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
