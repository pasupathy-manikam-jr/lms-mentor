<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the first admin account (admin@example.com / Zx123456). Change the password after the first login. Safe to run more than once.
     */
    public function run(): void
    {
        $admin = User::firstOrNew(['email' => 'admin@example.com']);

        $admin->forceFill([
            'name' => $admin->name ?? 'Admin',
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ]);

        // Only set a password on creation, so re-seeding never resets a changed one.
        if (! $admin->exists) {
            $admin->password = 'Zx123456';
        }

        $admin->save();
        $admin->assignRole(UserRole::Admin);
    }
}
