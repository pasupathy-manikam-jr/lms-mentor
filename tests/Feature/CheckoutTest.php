<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\User;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class, ProductSeeder::class]);
        $this->student = User::factory()->create();
        $this->course = Course::approved()->where('price', '>', 0)->orderBy('id')->firstOrFail();
        $this->course->update(['price' => 20]);
    }

    public function test_checkout_offers_enabled_methods_converted_to_their_currency()
    {
        $this->enable('stripe', ['publishable_key' => 'pk', 'secret_key' => 'sk', 'webhook_secret' => 'wh']);
        $this->enable('toyyibpay', ['secret_key' => 'ts', 'category_code' => 'cat'], currency: 'MYR', rate: 4.5);
        PaymentGateway::where('key', 'paypal')->update(['enabled' => false]);

        $this->actingAs($this->student)
            ->get(route('checkout.show', ['course', $this->course->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('checkout')
                ->where('item.price', 20)
                ->has('methods', 2)
                ->where('methods.0.key', 'stripe')
                ->where('methods.1.currency', 'MYR')
                ->where('methods.1.amount', 90));

        $this->get(route('courses.show', $this->course))->assertInertia(fn (Assert $page) => $page->where('ownership', null));
    }

    public function test_a_stripe_payment_is_verified_with_stripe_before_enrolling()
    {
        $this->enable('stripe', ['publishable_key' => 'pk', 'secret_key' => 'sk_test_x', 'webhook_secret' => 'wh']);
        Http::fake([
            'api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_1', 'url' => 'https://checkout.stripe.com/c/cs_1']),
            'api.stripe.com/v1/checkout/sessions/cs_1' => Http::sequence()
                ->push(['payment_status' => 'unpaid', 'client_reference_id' => '1', 'amount_total' => 2000, 'currency' => 'usd'])
                ->push(['payment_status' => 'paid', 'client_reference_id' => '1', 'amount_total' => 2000, 'currency' => 'usd', 'payment_intent' => 'pi_9']),
        ]);

        $this->actingAs($this->student)
            ->post(route('checkout.pay', ['course', $this->course->slug]), ['method' => 'stripe'], ['X-Inertia' => 'true'])
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', 'https://checkout.stripe.com/c/cs_1');

        $payment = Payment::sole();
        $this->assertSame(['pending', 'cs_1', '20.00', 'USD'], [$payment->status, $payment->transaction_id, $payment->amount, $payment->currency]);
        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer sk_test_x')
            && ($request['line_items'][0]['price_data']['unit_amount'] ?? null) === 2000);

        // Not paid yet: no access.
        $this->get(route('checkout.return', $payment))->assertRedirect(route('checkout.show', ['course', $this->course->slug]));
        $this->assertFalse(Enrollment::whereBelongsTo($this->student)->exists());

        $this->get(route('checkout.return', $payment))->assertRedirect(route('courses.show', $this->course));
        $this->assertSame(['paid', 'pi_9'], [$payment->fresh()->status, $payment->fresh()->transaction_id]);
        $this->assertTrue(Enrollment::whereBelongsTo($this->student)->whereBelongsTo($this->course)->where('price_paid', 20)->exists());

        // Someone else can't use this return link.
        $this->actingAs(User::factory()->create())->get(route('checkout.return', $payment))->assertNotFound();
    }

    public function test_paypal_orders_are_captured_and_checked()
    {
        $this->enable('paypal', ['client_id' => 'cid', 'client_secret' => 'sec']);
        $exam = Exam::published()->orderBy('id')->firstOrFail();
        $exam->update(['price' => 15]);
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'tok']),
            'api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response(['id' => 'ORDER1', 'links' => [['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER1']]]),
            'api-m.sandbox.paypal.com/v2/checkout/orders/ORDER1/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [['payments' => ['captures' => [['id' => 'CAP1', 'status' => 'COMPLETED', 'custom_id' => '1', 'amount' => ['currency_code' => 'USD', 'value' => '15.00']]]]]],
            ]),
        ]);

        $this->actingAs($this->student)
            ->post(route('checkout.pay', ['exam', $exam->slug]), ['method' => 'paypal'], ['X-Inertia' => 'true'])
            ->assertHeader('X-Inertia-Location', 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER1');

        $this->get(route('checkout.return', Payment::sole()))->assertRedirect(route('exams.show', $exam));
        $this->assertSame('CAP1', Payment::sole()->transaction_id);
        $this->assertTrue($this->student->examEnrollments()->whereBelongsTo($exam)->exists());
    }

    public function test_toyyibpay_charges_in_ringgit_and_checks_the_bill()
    {
        $this->enable('toyyibpay', ['secret_key' => 'ts', 'category_code' => 'cat'], currency: 'MYR', rate: 4.5);
        $product = Product::published()->where('price', '>', 0)->orderBy('id')->firstOrFail();
        $product->update(['price' => 10, 'stock' => 3]);
        Http::fake([
            'dev.toyyibpay.com/index.php/api/createBill' => Http::response([['BillCode' => 'abc123']]),
            'dev.toyyibpay.com/index.php/api/getBillTransactions' => Http::response([['billpaymentStatus' => '1', 'billpaymentAmount' => '45.00', 'billpaymentInvoiceNo' => 'TP99']]),
        ]);

        $this->actingAs($this->student)
            ->post(route('checkout.pay', ['product', $product->slug]), ['method' => 'toyyibpay'], ['X-Inertia' => 'true'])
            ->assertHeader('X-Inertia-Location', 'https://dev.toyyibpay.com/abc123');
        Http::assertSent(fn ($request) => str_contains($request->url(), 'createBill') && $request['billAmount'] === 4500);

        $this->get(route('checkout.return', Payment::sole()))->assertRedirect(route('store.show', $product));
        $this->assertSame(['MYR', '45.00', 'TP99'], [Payment::sole()->currency, Payment::sole()->amount, Payment::sole()->transaction_id]);
        $this->assertTrue(ProductOrder::whereBelongsTo($this->student)->whereBelongsTo($product)->where('total', 10)->exists());
        $this->assertSame(2, $product->fresh()->stock);

        $this->get(route('store.show', $product))->assertInertia(fn (Assert $page) => $page->where('ownership', 'owned'));
        $this->get(route('checkout.show', ['product', $product->slug]))->assertRedirect(route('store.show', $product));
    }

    public function test_a_bank_transfer_waits_for_approval()
    {
        Storage::fake('local');
        PaymentGateway::where('key', 'offline')->update(['enabled' => true, 'currency' => 'USD', 'instructions' => 'Bank: Example Bank']);

        $this->actingAs($this->student)
            ->post(route('checkout.offline', ['course', $this->course->slug]), ['paid_on' => today()->toDateString()])
            ->assertSessionHasErrors('proof');
        $this->post(route('checkout.offline', ['course', $this->course->slug]), [
            'paid_on' => today()->toDateString(), 'transaction_id' => 'REF-1', 'proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertRedirect(route('courses.show', $this->course));

        $payment = Payment::sole();
        $this->assertSame(['offline', 'pending', 'REF-1'], [$payment->method, $payment->status, $payment->transaction_id]);
        Storage::disk('local')->assertExists($payment->proof_path);
        $this->assertFalse(Enrollment::whereBelongsTo($this->student)->exists());
        $this->get(route('courses.show', $this->course))->assertInertia(fn (Assert $page) => $page->where('ownership', 'pending'));

        // A second checkout is refused while the first is being checked.
        $this->get(route('checkout.show', ['course', $this->course->slug]))->assertRedirect(route('courses.show', $this->course));
    }

    public function test_free_items_are_granted_at_once_and_unavailable_methods_are_refused()
    {
        $free = Course::approved()->whereKeyNot($this->course->id)->orderBy('id')->firstOrFail();
        $free->update(['price' => 0]);

        $this->actingAs($this->student)->post(route('checkout.free', ['course', $free->slug]))->assertRedirect(route('courses.show', $free));
        $this->assertTrue(Enrollment::whereBelongsTo($this->student)->whereBelongsTo($free)->exists());
        $this->post(route('checkout.free', ['course', $this->course->slug]))->assertForbidden();

        $this->post(route('checkout.pay', ['course', $this->course->slug]), ['method' => 'stripe'])->assertStatus(422);
        $this->get(route('checkout.show', ['course', 'no-such-course']))->assertNotFound();

        auth()->logout();
        $this->get(route('checkout.show', ['course', $this->course->slug]))->assertRedirect(route('login'));
    }

    public function test_a_coupon_lowers_the_price_at_every_step_and_a_full_discount_makes_it_free()
    {
        Storage::fake('local');
        PaymentGateway::where('key', 'offline')->update(['enabled' => true, 'currency' => 'USD', 'instructions' => 'Bank']);
        $window = ['valid_from' => now()->subDay(), 'valid_to' => now()->addDay(), 'is_active' => true];
        Coupon::create(['code' => 'HALF', 'discount_type' => 'percentage', 'discount' => 50, 'applies_to' => 'course', ...$window]);
        Coupon::create(['code' => 'ALL', 'discount_type' => 'fixed', 'discount' => 100, 'applies_to' => 'course', 'course_id' => $this->course->id, ...$window]);
        Coupon::create(['code' => 'EXAMONLY', 'discount_type' => 'percentage', 'discount' => 50, 'applies_to' => 'exam', ...$window]);

        $this->actingAs($this->student)
            ->get(route('checkout.show', ['course', $this->course->slug, 'coupon' => 'half']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('coupon.code', 'HALF')
                ->where('coupon.discount', 10)
                ->where('item.total', 10)
                ->where('methods.0.amount', 10));
        $this->get(route('checkout.show', ['course', $this->course->slug, 'coupon' => 'EXAMONLY']))
            ->assertInertia(fn (Assert $page) => $page->where('coupon', null)->whereNot('couponError', null));

        $this->post(route('checkout.offline', ['course', $this->course->slug]), [
            'coupon' => 'HALF', 'paid_on' => today()->toDateString(), 'proof' => UploadedFile::fake()->image('r.jpg'),
        ])->assertSessionHasNoErrors();
        $payment = Payment::sole();
        $this->assertSame(['10.00', '10.00'], [$payment->amount, $payment->discount]);
        $payment->fulfil();
        $this->assertTrue(Enrollment::whereBelongsTo($this->student)->where('price_paid', 10)->exists());

        // A 100% coupon: free enrolment, but only with the coupon.
        $other = User::factory()->create();
        $this->actingAs($other)->post(route('checkout.free', ['course', $this->course->slug]))->assertForbidden();
        $this->post(route('checkout.free', ['course', $this->course->slug]), ['coupon' => 'ALL'])->assertRedirect(route('courses.show', $this->course));
        $this->assertTrue(Enrollment::whereBelongsTo($other)->whereBelongsTo($this->course)->where('price_paid', 0)->exists());
    }

    /**
     * @param  array<string, string>  $keys
     */
    private function enable(string $key, array $keys, string $currency = 'USD', ?float $rate = null): void
    {
        PaymentGateway::where('key', $key)->firstOrFail()->update([
            'enabled' => true, 'test_mode' => true, 'currency' => $currency, 'exchange_rate' => $rate,
            'credentials' => collect($keys)->mapWithKeys(fn ($value, $name) => ["sandbox_{$name}" => $value])->all(),
        ]);
    }
}
