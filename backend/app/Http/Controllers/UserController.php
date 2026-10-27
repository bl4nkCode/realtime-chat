<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['search' => ['nullable', 'string', 'max:50']]);

        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->select('id', 'name')
            ->where('id', '!=', $request->user()->id)
            ->when($search !== '', function ($query) use ($search) {
                $escaped = addcslashes($search, '%_\\');
                $query->where('name', 'like', "%{$escaped}%");
            })
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json(['data' => $users]);
    }

        public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => ['id' => $user->id, 'name' => $user->name],
        ]);
    }
}
