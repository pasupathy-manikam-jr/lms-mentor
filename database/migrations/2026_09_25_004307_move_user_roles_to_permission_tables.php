<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the admin/instructor/student roles (spatie/laravel-permission) and move each user's
     * old users.role value onto them, then drop the column.
     */
    public function up(): void
    {
        $now = now();

        foreach (['admin', 'instructor', 'student'] as $name) {
            DB::table('roles')->insertOrIgnore(['name' => $name, 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now]);
        }

        $roleIds = DB::table('roles')->pluck('id', 'name');

        DB::table('users')->select(['id', 'role'])->orderBy('id')->each(function (object $user) use ($roleIds) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id' => $roleIds[$user->role] ?? $roleIds['student'],
                'model_type' => 'App\\Models\\User',
                'model_id' => $user->id,
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });

        app()['cache']->forget(config('permission.cache.key'));
    }

    /**
     * Put the column back, filled from each user's first role.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student')->after('email')->index();
        });

        DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->orderBy('model_has_roles.model_id')
            ->get(['model_has_roles.model_id', 'roles.name'])
            ->each(fn (object $row) => DB::table('users')->where('id', $row->model_id)->update(['role' => $row->name]));
    }
};
