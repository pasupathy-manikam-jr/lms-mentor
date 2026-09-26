<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Post;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LandingSeeder extends Seeder
{
    /**
     * Seed the sample content shown on the landing page. Safe to run more than once.
     */
    public function run(): void
    {
        $categories = collect([
            ['Management Science', 'briefcase'],
            ['Healthcare Management', 'hospital'],
            ['Medical Sciences', 'stethoscope'],
            ['Pharmacology', 'pill'],
            ['Ayurveda', 'leaf'],
            ['Siddha Medicine', 'sprout'],
            ['Yoga & Wellness', 'flower'],
            ['Nutrition & Dietetics', 'apple'],
        ])->mapWithKeys(fn (array $category) => [
            $category[0] => Category::updateOrCreate(
                ['slug' => Str::slug($category[0])],
                ['name' => $category[0], 'icon' => $category[1]],
            ),
        ]);

        $instructors = collect([
            ['Dr. Ananya Rao', 'Ayurveda Physician'],
            ['Dr. S. Karthikeyan', 'Siddha Practitioner'],
            ['Prof. Meera Iyer', 'Management Scientist'],
            ['Dr. Marcus Bell', 'Clinical Pharmacologist'],
            ['Priya Nair', 'Yoga Therapist'],
            ['Dr. Tom Okafor', 'Hospital Administrator'],
        ])->mapWithKeys(fn (array $instructor) => [
            $instructor[0] => Instructor::updateOrCreate(['name' => $instructor[0]], ['title' => $instructor[1]]),
        ]);

        // Who teaches each category's courses.
        $categoryInstructors = [
            'Management Science' => 'Prof. Meera Iyer',
            'Healthcare Management' => 'Dr. Tom Okafor',
            'Medical Sciences' => 'Dr. Marcus Bell',
            'Pharmacology' => 'Dr. Marcus Bell',
            'Ayurveda' => 'Dr. Ananya Rao',
            'Siddha Medicine' => 'Dr. S. Karthikeyan',
            'Yoga & Wellness' => 'Priya Nair',
            'Nutrition & Dietetics' => 'Dr. Ananya Rao',
        ];

        // [title, category, price, compare-at price, minutes, students, rating, reviews, popular]
        $courses = [
            ['Principles of Management: Planning, Organising & Leading', 'Management Science', 14.99, 69.99, 540, 1320, 4.8, 298, true],
            ['Operations Research for Managers', 'Management Science', 19.99, 84.99, 620, 740, 4.7, 163, true],
            ['Foundations of Ayurveda: Doshas, Dhatus & Prakriti', 'Ayurveda', 12.99, 59.99, 480, 1890, 4.9, 412, true],
            ['Introduction to Siddha Medicine: Principles & History', 'Siddha Medicine', 12.99, 59.99, 450, 960, 4.8, 207, true],
            ['Human Anatomy & Physiology Essentials', 'Medical Sciences', 19.99, 89.99, 760, 1450, 4.7, 331, true],
            ['Hospital Administration & Quality Management', 'Healthcare Management', 24.99, 99.99, 580, 610, 4.6, 128, true],
            ['Clinical Pharmacology Basics', 'Pharmacology', 19.99, 84.99, 520, 820, 4.7, 176, true],
            ['Yoga Therapy for Everyday Health', 'Yoga & Wellness', 9.99, 49.99, 360, 1240, 4.9, 289, true],
            ['Strategic Management & Decision Making', 'Management Science', 24.99, 99.99, 600, 230, 4.8, 44, false],
            ['Healthcare Finance & Insurance Essentials', 'Healthcare Management', 19.99, null, 420, 150, 4.6, 31, false],
            ['Medical Terminology for Health Professionals', 'Medical Sciences', 9.99, 44.99, 300, 380, 4.7, 83, false],
            ['Dravyaguna: Medicinal Plants in Ayurveda', 'Ayurveda', 16.99, 74.99, 510, 290, 4.8, 62, false],
            ['Ayurvedic Diet & Seasonal Routines (Ritucharya)', 'Ayurveda', 12.99, 54.99, 390, 340, 4.9, 77, false],
            ['Siddha Diagnosis: Understanding Envagai Thervu', 'Siddha Medicine', 16.99, 74.99, 470, 175, 4.8, 36, false],
            ['Varmam Therapy: An Introduction', 'Siddha Medicine', 14.99, 64.99, 330, 205, 4.7, 41, false],
            ['Clinical Nutrition: Diet Planning for Chronic Conditions', 'Nutrition & Dietetics', 19.99, 89.99, 540, 260, 4.8, 58, false],
        ];

        // [level, short description], keyed by course title.
        $details = [
            'Principles of Management: Planning, Organising & Leading' => ['beginner', 'Learn the four core functions of management and how managers in hospitals, clinics and wellness businesses use them every day. Short case studies turn each idea into a habit you can practise at work.'],
            'Operations Research for Managers' => ['intermediate', 'Use linear programming, queueing and simulation to schedule staff, manage stock and cut waiting times. Every model is built step by step in a spreadsheet, with no heavy maths required.'],
            'Foundations of Ayurveda: Doshas, Dhatus & Prakriti' => ['beginner', 'A clear introduction to the core ideas of Ayurveda: the three doshas, the seven dhatus and how prakriti shapes health. Ideal for students, wellness professionals and curious learners.'],
            'Introduction to Siddha Medicine: Principles & History' => ['beginner', 'Trace the history of Siddha medicine and learn its central principles, from the 96 tattvas to the three humours, taught by a practising Siddha physician.'],
            'Human Anatomy & Physiology Essentials' => ['beginner', 'Tour the body system by system and see how structure and function fit together. Labelled diagrams and quick self-checks help the essentials stick.'],
            'Hospital Administration & Quality Management' => ['advanced', 'Run a hospital department with confidence: patient flow, accreditation standards, quality indicators and continuous improvement, drawn from real hospital practice.'],
            'Clinical Pharmacology Basics' => ['intermediate', 'Understand how drugs move through and act on the body: pharmacokinetics, pharmacodynamics, interactions and safe dosing, with clinical examples throughout.'],
            'Yoga Therapy for Everyday Health' => ['beginner', 'Gentle, evidence-informed yoga practices for back pain, stress and sleep. Each session includes modifications so you can practise safely at any level.'],
            'Strategic Management & Decision Making' => ['advanced', 'Analyse competitive position, set strategy and make better decisions under uncertainty, with frameworks tested on healthcare and wellness organisations.'],
            'Healthcare Finance & Insurance Essentials' => ['intermediate', 'Read a hospital budget, understand costing and reimbursement, and explain how health insurance works, all in plain language.'],
            'Medical Terminology for Health Professionals' => ['beginner', 'Decode medical words by learning their roots, prefixes and suffixes, and gain the vocabulary to read clinical notes with confidence.'],
            'Dravyaguna: Medicinal Plants in Ayurveda' => ['intermediate', 'Study the properties and actions of key Ayurvedic herbs (rasa, guna, virya and vipaka) and how they are chosen and combined in practice.'],
            'Ayurvedic Diet & Seasonal Routines (Ritucharya)' => ['beginner', 'Adapt what you eat and how you live to each season, following Ayurveda\'s ritucharya, with simple meal ideas and daily routines.'],
            'Siddha Diagnosis: Understanding Envagai Thervu' => ['advanced', 'Learn the eight-fold method of Siddha examination, from pulse (naadi) to tongue and urine, and how practitioners bring the findings together.'],
            'Varmam Therapy: An Introduction' => ['intermediate', 'An introduction to varmam, the Siddha system of vital points: their history, classification and the safety principles behind therapeutic use.'],
            'Clinical Nutrition: Diet Planning for Chronic Conditions' => ['intermediate', 'Plan practical diets for diabetes, hypertension and heart disease using current guidelines, with sample meal plans and counselling tips.'],
        ];

        foreach ($courses as $i => [$title, $category, $price, $compareAt, $minutes, $students, $rating, $reviews, $popular]) {
            $slug = Str::slug($title);
            // Course images live in public/images/courses/{slug}.webp; cards show the category icon until one exists.
            $image = "images/courses/{$slug}.webp";

            $course = Course::updateOrCreate(['slug' => $slug], [
                'category_id' => $categories[$category]->id,
                'instructor_id' => $instructors[$categoryInstructors[$category]]->id,
                'level' => $details[$title][0],
                'short_description' => $details[$title][1],
                'title' => $title,
                'image_url' => file_exists(public_path($image)) ? asset($image) : null,
                'price' => $price,
                'compare_at_price' => $compareAt,
                'duration_minutes' => $minutes,
                'students_count' => $students,
                'rating' => $rating,
                'reviews_count' => $reviews,
                'is_popular' => $popular,
            ]);

            // Later rows count as newer, so they fill the "Latest courses" section.
            $course->forceFill(['created_at' => now()->subDays(count($courses) - $i)])->save();
        }

        // [title, category, author, course cover, read minutes, days ago, excerpt, body (paragraphs split by blank lines)]
        $posts = [
            ['Understanding Your Prakriti: A Beginner\'s Guide', 'Ayurveda', 'Dr. Ananya Rao', 'foundations-of-ayurveda-doshas-dhatus-prakriti', 6, 2,
                'Prakriti is your natural constitution. Knowing it helps you choose food, routines and treatments that suit you.',
                "In Ayurveda, prakriti is the balance of vata, pitta and kapha you are born with. It stays the same through life, while your current state, vikriti, changes with season, age, diet and stress.\n\nA practitioner assesses prakriti by looking at body build, skin, digestion, sleep, temperament and how you respond to heat, cold and effort. Questionnaires are a useful start, but a clinical examination is more reliable.\n\nKnowing your prakriti is practical. A vata-predominant person often does better with warm, regular meals and a steady routine, while a pitta-predominant person may need to avoid excess heat and spice.\n\nOur Foundations of Ayurveda course walks through the full assessment with worked examples and printable worksheets."],
            ['Siddha and Ayurveda: How the Two Traditions Differ', 'Siddha Medicine', 'Dr. S. Karthikeyan', 'introduction-to-siddha-medicine-principles-history', 7, 4,
                'Both systems share roots in the three humours, but they differ in language, diagnosis and materia medica.',
                "Siddha medicine developed in Tamil Nadu and is written largely in Tamil, while Ayurveda's classical texts are in Sanskrit. Both describe health through three humours, called vatham, pitham and kabam in Siddha.\n\nDiagnosis is one clear difference. Siddha uses envagai thervu, the eight-fold examination of pulse, tongue, eyes, skin, voice, urine, stool and overall appearance, with particular weight on the pulse and urine signs.\n\nSiddha also makes wide use of mineral and metal preparations alongside herbs, and has its own traditions such as varmam therapy.\n\nIf you are new to either system, start with the principles they share, then study each on its own terms."],
            ['Decision-Making Tools Every Manager Should Know', 'Management Science', 'Prof. Meera Iyer', 'strategic-management-decision-making', 5, 6,
                'Four simple tools that make everyday management decisions clearer and easier to explain.',
                "Good decisions are rarely about intuition alone. A few structured tools help managers compare options fairly and explain their choices to the team.\n\nA decision matrix scores each option against weighted criteria. A cost-benefit analysis puts rough numbers on what you gain and give up. A decision tree maps out uncertain outcomes and their likelihood. And a simple pre-mortem asks: if this fails in six months, what went wrong?\n\nNone of these tools needs special software. A spreadsheet or a whiteboard is enough, and the discussion they prompt is often as useful as the final score."],
            ['What Makes a Great Hospital Administrator?', 'Healthcare Management', 'Dr. Tom Okafor', 'hospital-administration-quality-management', 6, 9,
                'Clinical understanding, operational discipline and clear communication matter as much as budgets.',
                "Hospital administrators sit between clinicians, patients, finance and regulators. The best ones understand enough clinical work to earn trust on the wards.\n\nThey run operations with discipline: bed management, staffing rosters, supply chains and infection control all depend on reliable processes rather than heroics.\n\nThey also measure quality honestly. Readmission rates, patient feedback and incident reports are tools for learning, not blame.\n\nMost of all, they communicate clearly and often, so that staff know what is changing and why."],
            ['Eating With the Seasons: Lessons From Ritucharya', 'Nutrition & Dietetics', 'Dr. Ananya Rao', 'ayurvedic-diet-seasonal-routines-ritucharya', 5, 12,
                'Ritucharya adapts diet and routine to each season. Its core ideas fit well with modern nutrition advice.',
                "Ritucharya, the Ayurvedic seasonal regimen, divides the year into six seasons and recommends changes in food, sleep and activity for each.\n\nIn hot months it favours cooling, hydrating foods and lighter meals. In cold, dry months it suggests warm, nourishing food and a little more fat. During the rains it advises easily digested food, as digestion is thought to be weaker.\n\nMany of these ideas match modern advice on hydration, seasonal produce and regular meal times. You do not need to follow every rule to benefit; start by eating more of what is in season locally."],
            ['How to Build a Study Habit That Sticks', 'Medical Sciences', 'Dr. Marcus Bell', 'medical-terminology-for-health-professionals', 4, 15,
                'Short, regular sessions and active recall beat long weekend cramming, especially for medical vocabulary.',
                "Medical and health courses ask you to remember a lot of vocabulary. Short daily sessions work better than long, irregular ones.\n\nPick a fixed time and keep sessions to 25 to 30 minutes. Test yourself instead of re-reading: cover the definition, say it aloud, then check.\n\nUse spaced repetition. Review new terms the next day, then after three days, a week and a month. Flashcard apps can schedule this for you.\n\nFinally, track your streak. Seeing a run of study days is a surprisingly strong motivator."],
        ];

        foreach ($posts as [$title, $category, $author, $cover, $minutes, $daysAgo, $excerpt, $body]) {
            $image = "images/courses/{$cover}.webp";

            Post::updateOrCreate(['slug' => Str::slug($title)], [
                'category_id' => $categories[$category]->id,
                'title' => $title,
                'excerpt' => $excerpt,
                'body' => collect(explode("\n\n", $body))->map(fn (string $paragraph) => '<p>'.e($paragraph).'</p>')->implode(''),
                'image_url' => file_exists(public_path($image)) ? asset($image) : null,
                'author_name' => $author,
                'read_minutes' => $minutes,
                'published_at' => now()->subDays($daysAgo),
            ]);
        }
    }
}
