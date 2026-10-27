<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrivateMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
        $this->message->loadMissing('sender:id,name');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat.user.'.$this->message->receiver_id)];
    }

    public function broadcastAs(): string
    {
        return 'private-message.sent';
    }

    public function broadcastWith(): array
    {
        return (new MessageResource($this->message))->resolve();
    }
}
