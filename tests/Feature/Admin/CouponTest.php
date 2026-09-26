<?php

namespace Tests\Feature\Admin;

use App\Models\Coupon;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_coupons_are_created_upper_case_in_utc_listed_searched_edited_and_deleted()
    {
        $course = Course::orderBy('id')->firstOrFail();
        $this->actingAs($this->admin);

        $this->post(route('admin.course-coupons.store'), $this->payload(['code' => ' welcome10 ', 'item_id' => $course->id, 'valid_from' => '2026-10-01T09:00:00+05:30']))
            ->assertSessionHasNoErrors();

        $coupon = Coupon::firstOrFail();
        $this->assertSame('WELCOME10', $coupon->code);
        $this->assertSame('2026-10-01 03:30:00', $coupon->valid_from->format('Y-m-d H:i:s'));

        $this->post(route('admin.course-coupons.store'), $this->payload(['code' => 'GLOBAL5']))->assertSessionHasNoErrors();

        $this->get(route('admin.course-coupons.index', ['search' => 'welc']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/course-coupons/index')
                ->where('coupons.total', 1)
                ->where('coupons.data.0.item.id', $course->id));

        $this->put(route('admin.course-coupons.update', $coupon), $this->payload(['code' => 'WELCOME10', 'discount' => 15]))->assertSessionHasNoErrors();
        $this->assertSame('15.00', $coupon->refresh()->discount);

        $this->delete(route('admin.course-coupons.destroy', $coupon));
        $this->assertModelMissing($coupon);
    }

    public function test_validation_rejects_duplicates_bad_percentages_and_backwards_dates()
    {
        $this->actingAs($this->admin);
        Coupon::create([...collect($this->payload(['code' => 'TAKEN']))->except('item_id')->all(), 'valid_from' => now(), 'valid_to' => now()->addDay()]);

        $this->post(route('admin.course-coupons.store'), $this->payload(['code' => 'taken', 'discount' => 120, 'valid_to' => '2026-09-01T00:00:00Z']))
            ->assertSessionHasErrors(['code', 'discount', 'valid_to']);

        $this->post(route('admin.course-coupons.store'), $this->payload(['code' => 'has space']))->assertSessionHasErrors('code');

        $this->actingAs(User::factory()->create())->get(route('admin.course-coupons.index'))->assertForbidden();
    }

    public function test_exam_coupons_are_kept_apart_from_course_coupons()
    {
        $this->seed(ExamSeeder::class);
        $exam = Exam::orderBy('id')->firstOrFail();
        $this->actingAs($this->admin);

        $this->post(route('admin.exam-coupons.store'), $this->payload(['code' => 'EXAM10', 'item_id' => $exam->id]))->assertSessionHasNoErrors();
        $this->post(route('admin.course-coupons.store'), $this->payload(['code' => 'COURSE10']))->assertSessionHasNoErrors();

        $examCoupon = Coupon::where('code', 'EXAM10')->firstOrFail();
        $this->assertSame(['exam', $exam->id, null], [$examCoupon->applies_to, $examCoupon->exam_id, $examCoupon->course_id]);

        $this->get(route('admin.exam-coupons.index'))
            ->assertInertia(fn (Assert $page) => $page->where('scope', 'exam')->where('coupons.total', 1)->where('coupons.data.0.item.title', $exam->title));
        $this->get(route('admin.course-coupons.index'))
            ->assertInertia(fn (Assert $page) => $page->where('coupons.total', 1)->where('coupons.data.0.code', 'COURSE10'));

        // A coupon can only be changed from its own page, and an exam id is checked against exams.
        $this->delete(route('admin.course-coupons.destroy', $examCoupon))->assertNotFound();
        $this->post(route('admin.exam-coupons.store'), $this->payload(['code' => 'BAD', 'item_id' => 99999]))->assertSessionHasErrors('item_id');
    }

    public function test_product_coupons_have_their_own_scope()
    {
        $this->seed(ProductSeeder::class);
        $product = Product::orderBy('id')->firstOrFail();
        $this->actingAs($this->admin);

        $this->post(route('admin.product-coupons.store'), $this->payload(['code' => 'SHOP10', 'item_id' => $product->id]))->assertSessionHasNoErrors();

        $coupon = Coupon::firstOrFail();
        $this->assertSame(['product', $product->id], [$coupon->applies_to, $coupon->product_id]);
        $this->get(route('admin.product-coupons.index'))
            ->assertInertia(fn (Assert $page) => $page->where('scope', 'product')->where('coupons.data.0.item.title', $product->title));
        $this->get(route('admin.course-coupons.index'))->assertInertia(fn (Assert $page) => $page->where('coupons.total', 0));
    }

    public function test_status_reflects_the_switch_and_the_validity_window()
    {
        Carbon::setTestNow('2026-10-15 12:00:00');
        $make = fn (array $attributes) => new Coupon([...collect($this->payload())->except('item_id')->all(), 'valid_from' => '2026-10-01', 'valid_to' => '2026-10-31', ...$attributes]);

        $this->assertSame('active', $make([])->status());
        $this->assertSame('inactive', $make(['is_active' => false])->status());
        $this->assertSame('scheduled', $make(['valid_from' => '2026-10-20'])->status());
        $this->assertSame('expired', $make(['valid_to' => '2026-10-10'])->status());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'code' => 'SAVE20', 'discount_type' => 'percentage', 'discount' => 20, 'item_id' => null,
            'valid_from' => '2026-10-01T00:00:00Z', 'valid_to' => '2026-12-31T23:59:00Z', 'is_active' => true,
            ...$overrides,
        ];
    }
}
