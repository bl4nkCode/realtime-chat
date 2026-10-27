<?php

namespace App\Http\Controllers;

use App\Events\MessagesRead;
use App\Events\PrivateMessageSent;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $meId = $request->user()->id;

        // The id of the newest message for each person I've talked with.
        $latestIds = Message::query()
            ->selectRaw('MAX(id) as id')
            ->whereNotNull('receiver_id')
            ->where(fn($q) => $q
                ->where('sender_id', $meId)
                ->orWhere('receiver_id', $meId))
            ->groupByRaw(
                'CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END',
                [$meId]
            )
            ->pluck('id');

        $latest = Message::with('sender:id,name', 'receiver:id,name')
            ->whereIn('id', $latestIds)
            ->orderByDesc('id')
            ->get();

        // How many messages from each person I haven't read yet.
        $unread = Message::query()
            ->selectRaw('sender_id, COUNT(*) as total')
            ->where('receiver_id', $meId)
            ->whereNull('read_at')
            ->groupBy('sender_id')
            ->pluck('total', 'sender_id');

        $data = $latest->map(function (Message $message) use ($meId, $unread) {
            $partner = (int) $message->sender_id === $meId
                ? $message->receiver
                : $message->sender;

            return [
                'user' => ['id' => $partner->id, 'name' => $partner->name],
                'last_message' => (new MessageResource($message))->resolve(),
                'unread_count' => (int) ($unread[$partner->id] ?? 0),
            ];
        })->values();

        return response()->json(['data' => $data]);
    }

    public function messages(Request $request, User $user): AnonymousResourceCollection
    {
        $meId = $request->user()->id;

        $messages = Message::with('sender:id,name')
            ->where(function ($query) use ($meId, $user) {
                $query->where(fn($q) => $q
                    ->where('sender_id', $meId)
                    ->where('receiver_id', $user->id))
                    ->orWhere(fn($q) => $q
                        ->where('sender_id', $user->id)
                        ->where('receiver_id', $meId));
            })
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, User $user): MessageResource
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot message yourself.');

        $message = $request->user()->sentMessages()->create([
            'receiver_id' => $user->id,
            'body' => $request->validated('body'),
        ]);

        $message->load('sender:id,name');

        PrivateMessageSent::dispatch($message);

        return new MessageResource($message);
    }

        public function markRead(Request $request, User $user): JsonResponse
    {
        $meId = $request->user()->id;

        $ids = Message::where('sender_id', $user->id)
            ->where('receiver_id', $meId)
            ->whereNull('read_at')
            ->pluck('id');

        if ($ids->isEmpty()) {
            return response()->json(['marked' => 0]);
        }

        $readAt = now();

        Message::whereIn('id', $ids)->update(['read_at' => $readAt]);

        MessagesRead::dispatch($meId, $user->id, $ids->all(), $readAt->toIso8601String());

        return response()->json(['marked' => $ids->count()]);
    }
}
