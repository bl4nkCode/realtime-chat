<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  int  $readerId  The user who read the messages.
     * @param  int  $senderId  The user who wrote them (gets notified).
     * @param  array<int>  $messageIds
     */
    public function __construct(
        public int $readerId,
        public int $senderId,
        public array $messageIds,
        public string $readAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat.user.'.$this->senderId)];
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }

    public function broadcastWith(): array
    {
        return [
            'reader_id' => $this->readerId,
            'message_ids' => $this->messageIds,
            'read_at' => $this->readAt,
        ];
    }
}
