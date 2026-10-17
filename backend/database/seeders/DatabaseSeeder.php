<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $test = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $others = User::factory()->count(4)->create();
        $everyone = $others->push($test);

        // Global room messages
        for ($i = 0; $i < 20; $i++) {
            Message::factory()->create([
                'sender_id' => $everyone->random()->id,
            ]);
        }

        // Private messages between random pairs
        for ($i = 0; $i < 15; $i++) {
            [$a, $b] = $everyone->random(2)->values();

            Message::factory()->create([
                'sender_id' => $a->id,
                'receiver_id' => $b->id,
            ]);
        }
    }
}
