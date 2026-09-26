<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Instructor;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Seed sample store products. Run after LandingSeeder, which creates the categories and instructors. Safe to run more than once.
     */
    public function run(): void
    {
        // [title, category slug, author, type, format, price, compare-at price, sales, rating, reviews, description]
        $products = [
            ['Ayurvedic Herb Reference Handbook', 'ayurveda', 'Dr. Ananya Rao', 'E-book', 'PDF, 220 pages', 12.00, 18.00, 640, 4.8, 112, 'Rasa, guna, virya and vipaka for 150 common medicinal plants, with classical references, dosage ranges and safety notes.'],
            ['Dosha Assessment Worksheets', 'ayurveda', 'Dr. Ananya Rao', 'Template', 'Printable PDF + editable DOCX', 0, null, 1850, 4.7, 204, 'Ready-to-print prakriti and vikriti questionnaires with a scoring sheet, for classroom practice or client intake.'],
            ['Siddha Pulse Diagnosis Study Guide', 'siddha-medicine', 'Dr. S. Karthikeyan', 'Study guide', 'PDF, 96 pages', 15.00, null, 210, 4.9, 38, 'A step-by-step guide to naadi examination and the eight-fold envagai thervu, with case notes and self-check questions.'],
            ['Human Anatomy Wall Chart Set', 'medical-sciences', 'Dr. Marcus Bell', 'Chart', 'Set of 6 high-resolution PDFs (A2)', 24.00, 32.00, 380, 4.8, 67, 'Skeletal, muscular, nervous, cardiovascular, respiratory and digestive systems, labelled for print or screen.'],
            ['Pharmacology Drug Flashcards', 'pharmacology', 'Dr. Marcus Bell', 'Flashcards', '300 printable cards + Anki deck', 9.00, 14.00, 920, 4.7, 158, 'Drug class, mechanism, key side effects and interactions for the 300 most-tested drugs, ready to print or import into Anki.'],
            ['Hospital Quality Audit Toolkit', 'healthcare-management', 'Dr. Tom Okafor', 'Template', 'XLSX workbook + DOCX checklists', 39.00, null, 145, 4.8, 29, 'Audit checklists, incident logs and a quality-indicator dashboard aligned to common accreditation standards.'],
            ['Management Case Study Collection', 'management-science', 'Prof. Meera Iyer', 'E-book', 'PDF + EPUB, 180 pages', 14.00, 22.00, 300, 4.6, 51, 'Twelve short case studies from hospitals and clinics on planning, staffing, budgeting and leadership, with discussion questions.'],
            ['Therapeutic Yoga Sequence Cards', 'yoga-wellness', 'Priya Nair', 'Flashcards', '64 printable cards', 11.00, null, 540, 4.9, 96, 'Illustrated sequences for back pain, stress, sleep and joint mobility, each with cues and contraindications.'],
            ['Clinical Meal Planner Templates', 'nutrition-dietetics', 'Dr. Ananya Rao', 'Template', 'Editable XLSX + printable PDF', 0, null, 1320, 4.7, 187, 'Weekly meal planners with calorie and macronutrient totals for diabetes, hypertension and weight management.'],
        ];

        // Each product reuses the cover of its closest course (public/images/courses/{slug}.webp).
        $courseCovers = [
            'ayurvedic-herb-reference-handbook' => 'dravyaguna-medicinal-plants-in-ayurveda',
            'dosha-assessment-worksheets' => 'foundations-of-ayurveda-doshas-dhatus-prakriti',
            'siddha-pulse-diagnosis-study-guide' => 'siddha-diagnosis-understanding-envagai-thervu',
            'human-anatomy-wall-chart-set' => 'human-anatomy-physiology-essentials',
            'pharmacology-drug-flashcards' => 'clinical-pharmacology-basics',
            'hospital-quality-audit-toolkit' => 'hospital-administration-quality-management',
            'management-case-study-collection' => 'strategic-management-decision-making',
            'therapeutic-yoga-sequence-cards' => 'yoga-therapy-for-everyday-health',
            'clinical-meal-planner-templates' => 'clinical-nutrition-diet-planning-for-chronic-conditions',
        ];

        $categories = Category::pluck('id', 'slug');
        $instructors = Instructor::pluck('id', 'name');

        foreach ($products as [$title, $category, $author, $type, $format, $price, $compareAt, $sales, $rating, $reviews, $description]) {
            $slug = Str::slug($title);
            // Cards show the category icon when the cover file is missing.
            $image = "images/courses/{$courseCovers[$slug]}.webp";

            $product = Product::updateOrCreate(['slug' => $slug], [
                'category_id' => $categories[$category],
                'instructor_id' => $instructors[$author],
                'title' => $title,
                'type' => $type,
                'format' => $format,
                'summary' => $description,
                'image_url' => file_exists(public_path($image)) ? asset($image) : null,
                'price' => $price,
                'compare_at_price' => $compareAt,
                'sales_count' => $sales,
                'rating' => $rating,
                'reviews_count' => $reviews,
            ]);

            if ($product->infoItems()->doesntExist()) {
                $this->seedInfo($product, $author, $type, $format, (float) $price);
            }
        }
    }

    /**
     * Specifications from the product's own details, and FAQs about how the store delivers it.
     */
    private function seedInfo(Product $product, string $author, string $type, string $format, float $price): void
    {
        $items = [
            ['specification', 'Type', $type],
            ['specification', 'Format', $format],
            ['specification', 'Author', $author],
            ['specification', 'Language', 'English'],
            ['faq', 'How do I get the files after buying?', 'The files appear in your dashboard straight after checkout, and you can download them again at any time.'],
            ['faq', $price > 0 ? 'Can I get a refund?' : 'Is it really free?', $price > 0
                ? 'Digital products cannot be returned, but contact us within 7 days if a file is damaged or missing and we will fix it.'
                : 'Yes. Sign in and add it to your library at no cost.'],
            ['faq', 'Can I share it with my class?', 'Your copy is for your own study or practice. Ask us about a group licence for teaching.'],
        ];

        foreach ($items as $position => [$kind, $title, $body]) {
            $product->infoItems()->create(['type' => $kind, 'title' => $title, 'body' => $body, 'position' => $position]);
        }
    }
}
