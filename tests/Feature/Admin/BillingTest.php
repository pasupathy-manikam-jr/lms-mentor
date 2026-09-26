<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Models\PayoutRequest;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ProductSeeder::class]);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_gateway_keys_are_stored_encrypted_and_never_sent_back()
    {
        $stripe = PaymentGateway::firstWhere('key', 'stripe');
        $this->actingAs($this->admin);

        // Enabling needs the keys for the current mode.
        $this->put(route('admin.billing.gateways.update', $stripe), ['enabled' => true, 'test_mode' => true, 'currency' => 'MYR'])
            ->assertSessionHasErrors(['exchange_rate']);
        $this->put(route('admin.billing.gateways.update', $stripe), ['enabled' => true, 'test_mode' => true, 'currency' => 'MYR', 'exchange_rate' => 4.7])
            ->assertSessionHasErrors('enabled');

        $keys = ['sandbox_publishable_key' => 'pk_test_1', 'sandbox_secret_key' => 'sk_test_secret', 'sandbox_webhook_secret' => 'whsec_1'];
        $this->put(route('admin.billing.gateways.update', $stripe), ['enabled' => true, 'test_mode' => true, 'currency' => 'MYR', 'exchange_rate' => 4.7, 'credentials' => $keys])
            ->assertSessionHasNoErrors();

        // A blank field keeps the saved key.
        $this->put(route('admin.billing.gateways.update', $stripe), ['enabled' => true, 'test_mode' => true, 'currency' => 'MYR', 'exchange_rate' => 4.7, 'credentials' => ['sandbox_secret_key' => '']]);
        $this->assertSame('sk_test_secret', $stripe->fresh()->credentials['sandbox_secret_key']);
        $this->assertSame(47.0, $stripe->fresh()->convert(10));
        $this->assertStringNotContainsString('sk_test_secret', DB::table('payment_gateways')->where('key', 'stripe')->value('credentials'));

        $this->get(route('admin.billing.gateways'))
            ->assertDontSee('sk_test_secret')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/billing/gateways')
                ->where('gateways.0.enabled', true)
                ->where('gateways.0.saved.sandbox_secret_key', true)
                ->where('gateways.0.saved.live_secret_key', false));

        $this->put(route('admin.billing.gateways.update', PaymentGateway::firstWhere('key', 'toyyibpay')), ['currency' => 'USD'])
            ->assertSessionHasErrors('currency');
        $this->put(route('admin.billing.gateways.update', PaymentGateway::firstWhere('key', 'offline')), ['enabled' => true, 'currency' => 'INR'])
            ->assertSessionHasErrors('instructions');
    }

    public function test_approving_an_offline_payment_gives_access_and_rejecting_does_not()
    {
        Storage::fake('local');
        $student = User::factory()->create();
        $course = Course::approved()->firstOrFail();
        $product = Product::firstOrFail();
        $coursePayment = $this->offlinePayment($student, $course);
        $productPayment = $this->offlinePayment($student, $product);
        $this->actingAs($this->admin);

        $this->get(route('admin.billing.payments.offline', ['status' => 'pending']))
            ->assertInertia(fn (Assert $page) => $page->where('type', 'offline')->where('payments.total', 2)->where('payments.data.0.item.type', 'product'));

        $this->post(route('admin.billing.payments.approve', $coursePayment))->assertSessionHasNoErrors();
        $this->assertSame('paid', $coursePayment->fresh()->status);
        $this->assertTrue(Enrollment::whereBelongsTo($student)->whereBelongsTo($course)->where('price_paid', $course->price)->exists());
        $this->post(route('admin.billing.payments.approve', $coursePayment))->assertForbidden();

        $this->post(route('admin.billing.payments.reject', $productPayment), ['note' => 'No transfer found'])->assertSessionHasNoErrors();
        $this->assertSame(['rejected', 'No transfer found'], [$productPayment->fresh()->status, $productPayment->fresh()->note]);
        $this->assertFalse(ProductOrder::whereBelongsTo($student)->exists());

        $this->get(route('admin.billing.payments.proof', $coursePayment))->assertOk();
        $this->get(route('admin.billing.payments.online'))->assertInertia(fn (Assert $page) => $page->where('payments.total', 0));
    }

    public function test_payout_requests_are_paid_or_rejected_and_move_to_history()
    {
        $instructor = Instructor::firstOrFail();
        $first = PayoutRequest::create(['instructor_id' => $instructor->id, 'amount' => 120]);
        $second = PayoutRequest::create(['instructor_id' => $instructor->id, 'amount' => 80]);
        $this->actingAs($this->admin);

        $this->get(route('admin.billing.payouts.requests'))->assertInertia(fn (Assert $page) => $page->where('view', 'requests')->where('payouts.total', 2));

        $this->post(route('admin.billing.payouts.approve', $first), [])->assertSessionHasErrors('payout_method');
        $this->post(route('admin.billing.payouts.approve', $first), ['payout_method' => 'Bank transfer', 'note' => 'Ref 123'])->assertSessionHasNoErrors();
        $this->post(route('admin.billing.payouts.reject', $second))->assertSessionHasNoErrors();

        $this->assertSame(['approved', 'Bank transfer'], [$first->fresh()->status, $first->fresh()->payout_method]);
        $this->assertNotNull($first->fresh()->processed_at);
        $this->get(route('admin.billing.payouts.requests'))->assertInertia(fn (Assert $page) => $page->where('payouts.total', 0));
        $this->get(route('admin.billing.payouts.history'))->assertInertia(fn (Assert $page) => $page->where('payouts.total', 2));
    }

    public function test_students_cannot_see_billing()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.billing.gateways'))->assertForbidden();
    }

    private function offlinePayment(User $student, Course|Product $item): Payment
    {
        return Payment::create([
            'user_id' => $student->id, 'payable_type' => $item->getMorphClass(), 'payable_id' => $item->id,
            'amount' => 25, 'currency' => 'INR', 'method' => 'offline', 'status' => 'pending', 'paid_on' => today(),
            'proof_path' => UploadedFile::fake()->create('receipt.pdf', 20, 'application/pdf')->store('payment-proofs', 'local'),
        ]);
    }
}
