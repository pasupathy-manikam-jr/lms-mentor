<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\Admin\Billing\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\Billing\PaymentGatewayController;
use App\Http\Controllers\Admin\Billing\PayoutController;
use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\CertificateTemplateController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\CourseCategoryController;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\CourseCurriculumController;
use App\Http\Controllers\Admin\CourseInfoController;
use App\Http\Controllers\Admin\CourseLiveClassController;
use App\Http\Controllers\Admin\EditorImageController;
use App\Http\Controllers\Admin\EnrollmentController;
use App\Http\Controllers\Admin\ExamAttemptController as AdminExamAttemptController;
use App\Http\Controllers\Admin\ExamController as AdminExamController;
use App\Http\Controllers\Admin\ExamQuestionController;
use App\Http\Controllers\Admin\HomeCollectionController;
use App\Http\Controllers\Admin\InstructorController as AdminInstructorController;
use App\Http\Controllers\Admin\JobCircularController;
use App\Http\Controllers\Admin\LanguageController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\NewsletterController as AdminNewsletterController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\QuizQuestionController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AdminSectionController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CoursePlayerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExamAttemptController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\InstructorApplicationController;
use App\Http\Controllers\InstructorPayoutController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NewsletterSubscriptionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');
Route::get('about-us', AboutController::class)->name('about');
Route::get('our-team', [TeamController::class, 'index'])->name('team.index');
Route::get('our-team/{instructor}', [TeamController::class, 'show'])->name('team.show');
Route::get('blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('blog/{slug}', [BlogController::class, 'show'])->name('blog.show');
Route::get('careers', [CareerController::class, 'index'])->name('careers.index');
Route::get('careers/{slug}', [CareerController::class, 'show'])->name('careers.show');

Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');

Route::get('exams', [ExamController::class, 'index'])->name('exams.index');
Route::get('exams/{exam:slug}', [ExamController::class, 'show'])->name('exams.show');

Route::get('store', [ProductController::class, 'index'])->name('store.index');
Route::get('store/{product:slug}', [ProductController::class, 'show'])->name('store.show');

Route::get('pages/{page:slug}', [PageController::class, 'show'])->name('pages.show');

// Payment gateways notify the site here; exempt from CSRF in bootstrap/app.php.
Route::controller(PaymentWebhookController::class)->prefix('webhooks')->name('webhooks.')->middleware('throttle:60,1')->group(function () {
    Route::post('stripe', 'stripe')->name('stripe');
    Route::post('paypal', 'paypal')->name('paypal');
    Route::post('toyyibpay', 'toyyibpay')->name('toyyibpay');
});

Route::post('locale', LocaleController::class)->name('locale.update');

Route::post('newsletter', [NewsletterSubscriptionController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('newsletter.subscribe');
Route::get('newsletter/unsubscribe/{email}', [NewsletterSubscriptionController::class, 'unsubscribe'])
    ->middleware('signed')
    ->name('newsletter.unsubscribe');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(LearningController::class)->group(function () {
        Route::get('my-courses', 'courses')->name('learning.courses');
        Route::get('wishlist', 'wishlist')->name('learning.wishlist');
        Route::post('courses/{course:slug}/wishlist', 'toggleWishlist')->name('learning.wishlist.toggle');
    });

    Route::controller(ExamAttemptController::class)->group(function () {
        Route::post('exams/{exam:slug}/attempts', 'store')->name('exams.attempts.store');
        Route::get('exams/{exam:slug}/certificate', 'certificate')->name('exams.certificate');
        Route::get('exam-attempts/{attempt}', 'show')->name('exams.attempts.show');
        Route::post('exam-attempts/{attempt}/submit', 'submit')->name('exams.attempts.submit');
    });

    Route::controller(CheckoutController::class)->prefix('checkout')->name('checkout.')->group(function () {
        Route::get('payments/{payment}/return', 'return')->name('return');
        Route::get('payments/{payment}/cancel', 'cancel')->name('cancel');
        Route::get('{type}/{slug}', 'show')->whereIn('type', ['course', 'exam', 'product'])->name('show');
        Route::post('{type}/{slug}/free', 'free')->whereIn('type', ['course', 'exam', 'product'])->name('free');
        Route::post('{type}/{slug}/pay', 'pay')->whereIn('type', ['course', 'exam', 'product'])->middleware('throttle:10,1')->name('pay');
        Route::post('{type}/{slug}/offline', 'offline')->whereIn('type', ['course', 'exam', 'product'])->middleware('throttle:10,1')->name('offline');
    });

    Route::controller(CoursePlayerController::class)->prefix('courses/{course:slug}')->scopeBindings()->group(function () {
        Route::get('learn/{lesson?}', 'show')->name('courses.learn');
        Route::post('learn/{lesson}/complete', 'complete')->name('courses.learn.complete');
        Route::get('learn/{lesson}/file', 'file')->name('courses.learn.file');
        Route::get('learn/{lesson}/resources/{resource}', 'resource')->name('courses.learn.resource');
        Route::post('finish', 'finish')->name('courses.finish');
        Route::post('learn/{lesson}/quiz', [ExamAttemptController::class, 'startQuiz'])->name('courses.learn.quiz');
        Route::get('certificate', 'certificate')->name('courses.certificate');
    });

    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');

    Route::middleware('role:admin')->prefix('dashboard/course-categories')->name('admin.course-categories.')->group(function () {
        Route::get('/', [CourseCategoryController::class, 'index'])->name('index');
        Route::post('/', [CourseCategoryController::class, 'store'])->name('store');
        Route::put('sort', [CourseCategoryController::class, 'sort'])->name('sort');
        Route::put('{category}', [CourseCategoryController::class, 'update'])->name('update');
        Route::delete('{category}', [CourseCategoryController::class, 'destroy'])->name('destroy');
    });

    Route::middleware(['role:admin|instructor', 'owns'])->prefix('dashboard/exams')->name('admin.exams.')->group(function () {
        Route::controller(AdminExamController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            Route::get('{exam}/edit', 'edit')->name('edit');
            Route::put('{exam}', 'update')->name('update');
            Route::patch('{exam}/status', 'updateStatus')->name('status');
            Route::delete('{exam}', 'destroy')->name('destroy');
        });

        Route::controller(ExamQuestionController::class)->prefix('{exam}/questions')->name('questions.')->scopeBindings()->group(function () {
            Route::post('/', 'store')->name('store');
            Route::put('sort', 'sort')->name('sort');
            Route::put('{question}', 'update')->name('update');
            Route::delete('{question}', 'destroy')->name('destroy');
        });
    });

    foreach (['course', 'exam'] as $scope) {
        // Instructors see enrolments in their own courses and exams; only admins add or remove them.
        Route::middleware(['role:admin|instructor', 'owns'])->prefix("dashboard/{$scope}-enrollments")->name("admin.{$scope}-enrollments.")->controller(EnrollmentController::class)->group(function () use ($scope) {
            Route::get('/', 'index')->name('index')->defaults('scope', $scope);
            Route::post('/', 'store')->middleware('role:admin')->name('store')->defaults('scope', $scope);
            Route::delete('{enrollment}', 'destroy')->middleware('role:admin')->name('destroy')->defaults('scope', $scope);
        });
    }

    Route::middleware(['role:admin|instructor', 'owns'])->prefix('dashboard/products')->name('admin.products.')->controller(AdminProductController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::get('sales', 'sales')->name('sales');
        Route::post('/', 'store')->name('store');
        Route::get('{product}/edit', 'edit')->name('edit');
        Route::put('{product}', 'update')->name('update');
        Route::patch('{product}/status', 'updateStatus')->name('status');
        Route::delete('{product}', 'destroy')->name('destroy');

        Route::scopeBindings()->group(function () {
            Route::post('{product}/assets', 'storeAssets')->name('assets.store');
            Route::delete('{product}/assets/{asset}', 'destroyAsset')->name('assets.destroy');
            Route::post('{product}/info', 'storeInfo')->name('info.store');
            Route::put('{product}/info/{infoItem}', 'updateInfo')->name('info.update');
            Route::delete('{product}/info/{infoItem}', 'destroyInfo')->name('info.destroy');
        });
    });

    Route::middleware('role:admin')->prefix('dashboard/frontend/collections')->name('admin.collections.')->controller(HomeCollectionController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::put('/', 'update')->name('update');
    });

    Route::middleware('role:admin')->prefix('dashboard/frontend/pages')->name('admin.pages.')->controller(AdminPageController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{page}/edit', 'edit')->name('edit');
        Route::put('{page}', 'update')->name('update');
        Route::delete('{page}', 'destroy')->name('destroy');
    });

    // Certificate → Certificate and Marksheet share one controller; {kind} is fixed per group.
    foreach (['certificate', 'marksheet'] as $kind) {
        Route::middleware('role:admin')->prefix("dashboard/certification/{$kind}")->name("admin.certificates.{$kind}.")->controller(CertificateTemplateController::class)->group(function () use ($kind) {
            Route::get('/', 'index')->name('index')->defaults('kind', $kind);
            Route::get('create', 'create')->name('create')->defaults('kind', $kind);
            Route::post('/', 'store')->name('store')->defaults('kind', $kind);
            Route::get('{template}/edit', 'edit')->name('edit')->defaults('kind', $kind);
            Route::put('{template}', 'update')->name('update')->defaults('kind', $kind);
            Route::post('{template}/activate', 'activate')->name('activate')->defaults('kind', $kind);
            Route::delete('{template}', 'destroy')->name('destroy')->defaults('kind', $kind);
        });
    }

    Route::middleware('role:admin')->prefix('dashboard/language')->name('admin.languages.')->controller(LanguageController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::patch('{language}', 'update')->name('update');
        Route::post('{language}/default', 'makeDefault')->name('default');
        Route::delete('{language}', 'destroy')->name('destroy');
        Route::get('{language:code}/edit', 'edit')->name('edit');
        Route::put('{language:code}/lines', 'saveLines')->name('lines');
    });

    Route::middleware(['role:admin|instructor', 'owns'])->prefix('dashboard/media-library')->name('admin.media.')->controller(MediaController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::patch('{media}', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
        Route::post('folders', 'storeFolder')->middleware('role:admin')->name('folders.store');
        Route::delete('folders/{folder}', 'destroyFolder')->middleware('role:admin')->name('folders.destroy');
    });

    Route::middleware('role:admin')->prefix('dashboard/maintenance')->name('admin.maintenance')->controller(MaintenanceController::class)->group(function () {
        Route::get('/', 'index');
        Route::put('/', 'update')->name('.update');
        Route::post('clear-cache', 'clearCache')->name('.clear-cache');
    });

    Route::middleware('role:admin')->prefix('dashboard/settings')->name('admin.settings.')->controller(SettingsController::class)->group(function () {
        Route::post('smtp/test', 'testMail')->middleware('throttle:5,1')->name('test-mail');
        Route::get('{section}', 'show')->name('show');
        Route::put('{section}', 'update')->name('update');
    });

    Route::middleware('role:admin')->prefix('dashboard/users')->name('admin.users.')->controller(AdminUserController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::put('{user}', 'update')->name('update');
        Route::delete('{user}', 'destroy')->name('destroy');
    });

    Route::middleware('role:admin')->prefix('dashboard/exam-results')->name('admin.exam-attempts.')->controller(AdminExamAttemptController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{attempt}', 'show')->name('show');
        Route::put('{attempt}', 'update')->name('update');
    });

    Route::middleware('role:admin')->prefix('dashboard/newsletters')->name('admin.newsletters.')->controller(AdminNewsletterController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('{newsletter}', 'update')->name('update');
        Route::post('{newsletter}/send', 'send')->middleware('throttle:10,1')->name('send');
        Route::delete('{newsletter}', 'destroy')->name('destroy');
    });

    Route::middleware('role:admin')->prefix('dashboard/billings')->name('admin.billing.')->group(function () {
        Route::get('payment', [PaymentGatewayController::class, 'index'])->name('gateways');
        Route::put('payment/{gateway}', [PaymentGatewayController::class, 'update'])->name('gateways.update');

        Route::controller(AdminPaymentController::class)->group(function () {
            Route::get('payment-reports/online', 'online')->name('payments.online');
            Route::get('payment-reports/offline', 'offline')->name('payments.offline');
            Route::post('payments/{payment}/approve', 'approve')->name('payments.approve');
            Route::post('payments/{payment}/reject', 'reject')->name('payments.reject');
            Route::get('payments/{payment}/proof', 'proof')->name('payments.proof');
        });

        Route::controller(PayoutController::class)->group(function () {
            Route::get('payouts/request', 'requests')->name('payouts.requests');
            Route::get('payouts/history', 'history')->name('payouts.history');
            Route::post('payouts/{payoutRequest}/approve', 'approve')->name('payouts.approve');
            Route::post('payouts/{payoutRequest}/reject', 'reject')->name('payouts.reject');
        });
    });

    Route::middleware('role:admin')->prefix('dashboard/instructors')->name('admin.instructors.')->controller(AdminInstructorController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('applications', 'applications')->name('applications');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{instructor}/edit', 'edit')->name('edit');
        Route::put('{instructor}', 'update')->name('update');
        Route::patch('{instructor}/status', 'updateStatus')->name('status');
        Route::get('{instructor}/resume', 'resume')->name('resume');
        Route::delete('{instructor}', 'destroy')->name('destroy');
    });

    Route::middleware('role:instructor')->prefix('dashboard/earnings')->name('instructor.payouts.')->controller(InstructorPayoutController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->middleware('throttle:10,1')->name('store');
        Route::get('settings', 'settings')->name('settings');
        Route::put('settings', 'updateSettings')->name('settings.update');
    });

    Route::get('dashboard/become-instructor', [InstructorApplicationController::class, 'show'])->name('instructor-application.show');
    Route::post('dashboard/become-instructor', [InstructorApplicationController::class, 'store'])->name('instructor-application.store');

    Route::middleware('role:admin')->prefix('dashboard/job-circulars')->name('admin.job-circulars.')->controller(JobCircularController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{jobOpening}/edit', 'edit')->name('edit');
        Route::put('{jobOpening}', 'update')->name('update');
        Route::delete('{jobOpening}', 'destroy')->name('destroy');
    });

    Route::middleware(['role:admin|instructor', 'owns'])->prefix('dashboard/blogs')->name('admin.blogs.')->controller(AdminBlogController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{post}/edit', 'edit')->name('edit');
        Route::put('{post}', 'update')->name('update');
        Route::delete('{post}', 'destroy')->name('destroy');
    });

    // Buyers (and admins) download a product's files.
    Route::get('store/{product:slug}/files/{asset}', [AdminProductController::class, 'downloadAsset'])->scopeBindings()->name('store.files.download');

    foreach (['course', 'exam', 'product'] as $scope) {
        Route::middleware('role:admin')->prefix("dashboard/{$scope}-coupons")->name("admin.{$scope}-coupons.")->controller(CouponController::class)->group(function () use ($scope) {
            Route::get('/', 'index')->name('index')->defaults('scope', $scope);
            Route::post('/', 'store')->name('store')->defaults('scope', $scope);
            Route::put('{coupon}', 'update')->name('update')->defaults('scope', $scope);
            Route::delete('{coupon}', 'destroy')->name('destroy')->defaults('scope', $scope);
        });
    }

    Route::middleware(['role:admin|instructor', 'owns'])->prefix('dashboard/courses')->name('admin.courses.')->group(function () {
        Route::get('/', [AdminCourseController::class, 'index'])->name('index');
        Route::get('create', [AdminCourseController::class, 'create'])->name('create');
        Route::post('/', [AdminCourseController::class, 'store'])->name('store');
        Route::post('editor-images', EditorImageController::class)->name('editor-images');
        Route::get('{course}/edit', [AdminCourseController::class, 'edit'])->name('edit');
        Route::put('{course}', [AdminCourseController::class, 'update'])->name('update');
        Route::patch('{course}/status', [AdminCourseController::class, 'updateStatus'])->name('status');
        Route::delete('{course}', [AdminCourseController::class, 'destroy'])->name('destroy');

        Route::controller(CourseInfoController::class)->prefix('{course}/info')->name('info.')->scopeBindings()->group(function () {
            Route::post('/', 'store')->name('store');
            Route::put('{infoItem}', 'update')->name('update');
            Route::delete('{infoItem}', 'destroy')->name('destroy');
        });

        Route::controller(CourseLiveClassController::class)->prefix('{course}/live-classes')->name('live-classes.')->scopeBindings()->group(function () {
            Route::post('/', 'store')->name('store');
            Route::put('{liveClass}', 'update')->name('update');
            Route::delete('{liveClass}', 'destroy')->name('destroy');
        });

        Route::controller(CourseCurriculumController::class)->prefix('{course}')->scopeBindings()->group(function () {
            Route::post('sections', 'storeSection')->name('sections.store');
            Route::put('sections/sort', 'sortSections')->name('sections.sort');
            Route::put('sections/{section}', 'updateSection')->name('sections.update');
            Route::delete('sections/{section}', 'destroySection')->name('sections.destroy');
            Route::post('sections/{section}/lessons', 'storeLesson')->name('lessons.store');
            Route::put('sections/{section}/lessons/sort', 'sortLessons')->name('lessons.sort');
            Route::put('lessons/{lesson}', 'updateLesson')->name('lessons.update');
            Route::delete('lessons/{lesson}', 'destroyLesson')->name('lessons.destroy');
            Route::post('lessons/{lesson}/resources', 'storeResource')->name('lessons.resources.store');
            Route::delete('lessons/{lesson}/resources/{resource}', 'destroyResource')->name('lessons.resources.destroy');
        });

        Route::controller(QuizQuestionController::class)->prefix('{course}/quizzes/{lesson}/questions')->name('quizzes.questions.')->scopeBindings()->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::put('sort', 'sort')->name('sort');
            Route::put('{question}', 'update')->name('update');
            Route::delete('{question}', 'destroy')->name('destroy');
        });
    });

    // Admin sections not built yet; each is replaced by its own route as it gets built.
    Route::get('dashboard/{section}', AdminSectionController::class)
        ->where('section', '[a-z0-9/-]+')
        ->middleware('role:admin')
        ->name('admin.section');
});

require __DIR__.'/settings.php';
