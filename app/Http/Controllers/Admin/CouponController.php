<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Course, Exam and Product Coupons: discount codes for one course/exam or all of them. The route's
 * `scope` default says which kind a page manages. Codes are unique across both, stored upper-case, and
 * validity times arrive as ISO 8601 with the browser's offset and are stored in UTC.
 */
class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $scope = $this->scope($request);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $coupons = Coupon::query()
            ->where('applies_to', $scope)
            ->with(["{$scope}:id,title"])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('code', "%{$search}%"))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (Coupon $coupon) => [
                ...$coupon->only(['id', 'code', 'discount_type', 'discount', 'is_active']),
                'item' => $coupon->{$scope}?->only(['id', 'title']),
                'valid_from' => $coupon->valid_from->toIso8601String(),
                'valid_to' => $coupon->valid_to->toIso8601String(),
                'status' => $coupon->status(),
            ]);

        return Inertia::render('admin/course-coupons/index', [
            'scope' => $scope,
            'coupons' => $coupons,
            'filters' => $filters,
            'items' => $this->itemModel($scope)::query()->orderBy('title')->get(['id', 'title']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Coupon::create($this->validated($request));

        return $this->done(__('Coupon created.'));
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $this->ensureInScope($request, $coupon);
        $coupon->update($this->validated($request, $coupon));

        return $this->done(__('Coupon updated.'));
    }

    public function destroy(Request $request, Coupon $coupon): RedirectResponse
    {
        $this->ensureInScope($request, $coupon);
        $coupon->delete();

        return $this->done(__('Coupon deleted.'));
    }

    /**
     * course, exam or product, from the route.
     */
    private function scope(Request $request): string
    {
        return $request->route()->defaults['scope'];
    }

    /**
     * @return class-string<Course|Exam|Product>
     */
    private function itemModel(string $scope): string
    {
        return match ($scope) {
            'exam' => Exam::class,
            'product' => Product::class,
            default => Course::class,
        };
    }

    private function ensureInScope(Request $request, Coupon $coupon): void
    {
        abort_unless($coupon->applies_to === $this->scope($request), 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        $scope = $this->scope($request);
        $request->merge(['code' => Str::upper(trim((string) $request->input('code')))]);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('coupons')->ignore($coupon)],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount' => ['required', 'numeric', 'gt:0', $request->input('discount_type') === 'percentage' ? 'max:100' : 'max:99999'],
            'item_id' => ['nullable', 'integer', Rule::exists((new ($this->itemModel($scope)))->getTable(), 'id')],
            'valid_from' => ['required', 'date'],
            'valid_to' => ['required', 'date', 'after:valid_from'],
            'is_active' => ['required', 'boolean'],
        ], [], ['item_id' => __($scope)]);

        return [
            'code' => $validated['code'],
            'discount_type' => $validated['discount_type'],
            'discount' => $validated['discount'],
            'is_active' => $validated['is_active'],
            'applies_to' => $scope,
            'course_id' => $scope === 'course' ? ($validated['item_id'] ?? null) : null,
            'exam_id' => $scope === 'exam' ? ($validated['item_id'] ?? null) : null,
            'product_id' => $scope === 'product' ? ($validated['item_id'] ?? null) : null,
            'valid_from' => Carbon::parse($validated['valid_from'])->utc(),
            'valid_to' => Carbon::parse($validated['valid_to'])->utc(),
        ];
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
