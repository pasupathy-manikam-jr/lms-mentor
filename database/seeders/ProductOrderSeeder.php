<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Sample store purchases by the EnrollmentSeeder students, spread over the current year, so the Sales
 * list has data. Run after EnrollmentSeeder and ProductSeeder. Students who already have orders are
 * skipped, so it is safe to run again.
 */
class ProductOrderSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::published()->orderBy('id')->get();
        $students = User::role(UserRole::Student->value)->where('email', 'like', '%@example.com')->orderBy('id')->get();

        if ($products->isEmpty()) {
            return;
        }

        $year = now()->year;

        foreach ($students as $i => $student) {
            if ($student->productOrders()->exists()) {
                continue;
            }

            // Two in three students buy one or two products.
            if ($i % 3 === 2) {
                continue;
            }

            foreach (range(0, $i % 2) as $n) {
                $product = $products[($i * 4 + $n * 3) % $products->count()];
                $orderedAt = now()->setDate($year, 1 + ($i + $n * 5) % now()->month, 1 + ($i * 2 + $n) % 28)->setTime(11 + $n, 40);
                $orderedAt = $orderedAt->isFuture() ? now()->subDays(1 + $i % 5) : $orderedAt;

                $student->productOrders()->forceCreate([
                    'product_id' => $product->id,
                    'subtotal' => $product->price,
                    'discount' => 0,
                    'tax' => 0,
                    'total' => $product->price,
                    'created_at' => $orderedAt,
                    'updated_at' => $orderedAt,
                ]);
            }
        }
    }
}
