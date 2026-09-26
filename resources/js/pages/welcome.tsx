import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    Flower2,
    HeartPulse,
    Landmark,
    Leaf,
    Sprout,
    Star,
    Sun,
    TreePine,
    Users,
    Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BackToTop } from '@/components/landing/back-to-top';
import { CategoryIcon } from '@/components/landing/category-icon';
import { CountUp } from '@/components/landing/count-up';
import { CourseCard } from '@/components/landing/course-card';
import { HeroCarousel } from '@/components/landing/hero-carousel';
import type { HeroSlide } from '@/components/landing/hero-carousel';
import { NewsletterForm } from '@/components/landing/newsletter-form';
import { PageHead } from '@/components/landing/page-head';
import { PostCard } from '@/components/landing/post-card';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { useLandingScroll } from '@/hooks/use-landing-scroll';
import { useTranslation } from '@/hooks/use-translation';
import { usePageContent } from '@/lib/page-content';
import type { PageProps } from '@/lib/page-content';
import { register } from '@/routes';
import { index as coursesIndex } from '@/routes/courses';
import { show as teamShow } from '@/routes/team';
import type { Category, Course, Instructor, Post } from '@/types';

type WelcomeProps = {
    categories: Category[];
    popularCourses: Course[];
    latestCourses: Course[];
    instructors: Instructor[];
    posts: Post[];
    page: PageProps;
};

const unsplash = (id: string, size: number) =>
    `https://images.unsplash.com/${id}?w=${size}&h=${size}&fit=crop&crop=faces`;

const heroAvatars = [
    'photo-1438761681033-6461ffad8d80',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1531545514256-b1400bc00f31',
    'photo-1522202176988-66273c2fd55f',
    'photo-1529156069898-49953e39b3ac',
];

// AI-generated scene images (public/images/hero). They are illustrative, not real instructors.
const heroSlides: HeroSlide[] = [
    {
        src: '/images/hero/ayurveda-physician.webp',
        alt: 'An Ayurveda physician reading a patient’s pulse in a clinic lined with herbs',
    },
    {
        src: '/images/hero/siddha-practitioner.webp',
        alt: 'A Siddha practitioner preparing herbal medicine in a stone mortar',
    },
    {
        src: '/images/hero/management-professor.webp',
        alt: 'A management professor in front of a whiteboard strategy diagram',
    },
    {
        src: '/images/hero/medical-doctor.webp',
        alt: 'A physician in a white coat with a stethoscope in a hospital corridor',
    },
    {
        src: '/images/hero/yoga-therapist.webp',
        alt: 'A yoga therapist seated in meditation in a sunlit studio',
    },
];

const heroCards: {
    icon: LucideIcon;
    value: string;
    label: string;
    position: string;
    delay: string;
}[] = [
    {
        icon: Users,
        value: '40k+',
        label: 'Learners enrolled',
        position: 'top-[8%] -left-8',
        delay: '0s',
    },
    {
        icon: Star,
        value: '4.9 rating',
        label: 'From 12k reviews',
        position: 'top-1/2 right-0',
        delay: '-2s',
    },
    {
        icon: Award,
        value: 'Certificates',
        label: 'On every course',
        position: 'bottom-[6%] left-0',
        delay: '-4s',
    },
];

// Placeholder partner names: swap for real logos when you have them.
const partners: { name: string; icon: LucideIcon }[] = [
    { name: 'Greenleaf Hospitals', icon: Leaf },
    { name: 'Sunrise Clinics', icon: Sun },
    { name: 'Lotus Wellness', icon: Flower2 },
    { name: 'Meridian Health', icon: HeartPulse },
    { name: 'Banyan Institute', icon: TreePine },
    { name: 'Kaveri Herbals', icon: Waves },
    { name: 'Tulsi Care', icon: Sprout },
    { name: 'Heritage Management School', icon: Landmark },
];

const stats = [
    { value: 40, suffix: 'k+', text: 'Learners in over 90 countries' },
    { value: 320, suffix: '+', text: 'Lessons from physicians and professors' },
    { value: 4.9, decimals: 1, text: 'Average course rating' },
    { value: 92, suffix: '%', text: 'Of learners finish what they start' },
];

function SectionHeading({
    eyebrow,
    title,
    text,
}: {
    eyebrow: string;
    title: string;
    text?: string;
}) {
    return (
        <div className="mx-auto mb-10 max-w-2xl text-center">
            <Badge variant="secondary">{eyebrow}</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                {title}
            </h2>
            {text && <p className="mt-3 text-muted-foreground">{text}</p>}
        </div>
    );
}

export default function Welcome({
    categories,
    popularCourses,
    latestCourses,
    instructors,
    posts,
    page,
}: WelcomeProps) {
    const { auth, name } = usePage().props;
    const getInitials = useInitials();
    const scrollTo = useLandingScroll();
    const { t } = useTranslation();
    const { text, seo } = usePageContent('home', page);

    return (
        <>
            <PageHead seo={seo} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader scrollTo={scrollTo} />

                <main>
                    <section className="relative overflow-hidden">
                        <div
                            className="pointer-events-none absolute -top-[30rem] -right-[30rem] size-[1200px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.45)_0%,transparent_70%)] opacity-25"
                            aria-hidden
                        />
                        <div
                            className="pointer-events-none absolute -right-[30rem] -bottom-[25rem] size-[1200px] rounded-full bg-[radial-gradient(circle,rgba(97,95,255,0.45)_0%,transparent_70%)] opacity-20"
                            aria-hidden
                        />
                        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 pt-12 pb-10 md:flex-row md:justify-between md:gap-6 md:pt-16">
                            <div className="relative z-10 w-full md:max-w-[480px]">
                                <p className="mb-2 text-lg font-medium text-amber-600 uppercase dark:text-amber-400">
                                    {text('hero_eyebrow')}
                                </p>
                                <h1 className="text-3xl leading-tight font-bold md:text-4xl lg:text-[42px] lg:leading-14">
                                    {text('hero_title')}
                                </h1>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    {text('hero_text')}
                                </p>
                                <div className="mt-6 mb-10 flex flex-wrap gap-3 md:mb-14">
                                    <Button
                                        size="lg"
                                        onClick={() => scrollTo('#courses')}
                                    >
                                        {text('hero_primary_button')}
                                    </Button>
                                    {!auth.user && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={register()}>
                                                {text('hero_secondary_button')}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-4">
                                        {heroAvatars.map((id) => (
                                            <Avatar
                                                key={id}
                                                className="size-11 ring-2 ring-background grayscale"
                                            >
                                                <AvatarImage
                                                    src={unsplash(id, 96)}
                                                    alt=""
                                                />
                                                <AvatarFallback />
                                            </Avatar>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                { length: 5 },
                                                (_, i) => (
                                                    <Star
                                                        key={i}
                                                        className="size-4 fill-amber-400 text-amber-400"
                                                        aria-hidden
                                                    />
                                                ),
                                            )}
                                            <p className="ml-1 font-medium">
                                                4.9
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {text('hero_proof')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative w-full max-w-[480px]">
                                <div
                                    className="pointer-events-none absolute top-1/2 left-1/2 size-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
                                    aria-hidden
                                />
                                <HeroCarousel slides={heroSlides} />
                                {heroCards.map(
                                    ({
                                        icon: Icon,
                                        value,
                                        label,
                                        position,
                                        delay,
                                    }) => (
                                        <Card
                                            key={label}
                                            style={{ animationDelay: delay }}
                                            className={`absolute hidden flex-row items-center gap-3 px-4 py-3 shadow-lg motion-safe:animate-float sm:flex ${position}`}
                                        >
                                            <span className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white">
                                                <Icon
                                                    className="size-5"
                                                    aria-hidden
                                                />
                                            </span>
                                            <div>
                                                <p className="font-semibold">
                                                    {t(value)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(label)}
                                                </p>
                                            </div>
                                        </Card>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="pb-12">
                            <p className="mb-6 text-center text-sm text-muted-foreground">
                                {t(
                                    'Hospitals and organisations that learn with :name',
                                    { name },
                                )}
                            </p>
                            <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                                <div className="flex w-max motion-safe:animate-marquee group-hover:[animation-play-state:paused]">
                                    {[0, 1].map((copy) => (
                                        <ul
                                            key={copy}
                                            aria-hidden={copy === 1}
                                            className="flex shrink-0 items-center gap-14 pr-14"
                                        >
                                            {partners.map(
                                                ({ name, icon: Icon }) => (
                                                    <li
                                                        key={name}
                                                        className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap text-muted-foreground/70"
                                                    >
                                                        <Icon
                                                            className="size-6"
                                                            aria-hidden
                                                        />
                                                        {name}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        data-reveal
                        id="categories"
                        className="bg-muted/50 py-16"
                    >
                        <div className="mx-auto max-w-7xl px-4">
                            <SectionHeading
                                eyebrow={text('categories_eyebrow')}
                                title={text('categories_title')}
                                text={text('categories_text')}
                            />
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {categories.map((category) => (
                                    <Card
                                        key={category.id}
                                        className="relative py-4 hover:-translate-y-1 hover:border-foreground/30 hover:shadow-md"
                                    >
                                        <CardContent className="flex items-center gap-3 px-4">
                                            <CategoryIcon
                                                name={category.icon}
                                                className="size-8 shrink-0 text-amber-600 dark:text-amber-400"
                                            />
                                            <div>
                                                <CardTitle>
                                                    <Link
                                                        href={coursesIndex.url({
                                                            query: {
                                                                category:
                                                                    category.slug,
                                                            },
                                                        })}
                                                        className="after:absolute after:inset-0"
                                                    >
                                                        {category.name}
                                                    </Link>
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {category.courses_count ===
                                                    1
                                                        ? t(':count course', {
                                                              count: category.courses_count,
                                                          })
                                                        : t(':count courses', {
                                                              count: category.courses_count,
                                                          })}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        data-reveal
                        id="courses"
                        className="mx-auto max-w-7xl px-4 py-16"
                    >
                        <SectionHeading
                            eyebrow={text('popular_eyebrow')}
                            title={text('popular_title')}
                            text={text('popular_text')}
                        />
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {popularCourses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </section>

                    <section
                        data-reveal
                        className="bg-primary py-16 text-primary-foreground"
                    >
                        <dl className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.text}
                                    className="flex flex-col-reverse text-center"
                                >
                                    <dt className="mt-2 text-sm opacity-80">
                                        {t(stat.text)}
                                    </dt>
                                    <dd className="text-4xl font-bold">
                                        <CountUp
                                            value={stat.value}
                                            decimals={stat.decimals}
                                            suffix={stat.suffix}
                                        />
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section
                        data-reveal
                        className="mx-auto max-w-7xl px-4 py-16"
                    >
                        <SectionHeading
                            eyebrow={text('latest_eyebrow')}
                            title={text('latest_title')}
                            text={text('latest_text')}
                        />
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {latestCourses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </section>

                    <section
                        data-reveal
                        id="instructors"
                        className="bg-muted/50 py-16"
                    >
                        <div className="mx-auto max-w-7xl px-4">
                            <SectionHeading
                                eyebrow={text('instructors_eyebrow')}
                                title={text('instructors_title')}
                                text={text('instructors_text')}
                            />
                            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
                                {instructors.map((person) => (
                                    <div
                                        key={person.id}
                                        className="group relative rounded-xl p-3 text-center transition-colors hover:bg-background"
                                    >
                                        <Avatar className="mx-auto size-20">
                                            {person.avatar_url && (
                                                <AvatarImage
                                                    src={person.avatar_url}
                                                    alt=""
                                                />
                                            )}
                                            <AvatarFallback className="bg-amber-500 text-xl font-semibold text-white">
                                                {getInitials(
                                                    person.name.replace(
                                                        /^(Dr|Prof)\.\s*/,
                                                        '',
                                                    ),
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="mt-3 font-semibold">
                                            {/* The stretched link makes the whole tile clickable. */}
                                            <Link
                                                href={teamShow.url(person.id)}
                                                className="after:absolute after:inset-0 group-hover:underline"
                                            >
                                                {person.name}
                                            </Link>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {person.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        data-reveal
                        id="faq"
                        className="mx-auto max-w-3xl px-4 py-16"
                    >
                        <SectionHeading
                            eyebrow={text('faq_eyebrow')}
                            title={text('faq_title')}
                            text={text('faq_text')}
                        />
                        <Accordion
                            type="single"
                            collapsible
                            defaultValue="faq-0"
                            className="rounded-xl border px-4"
                        >
                            {[1, 2, 3, 4, 5].map((number, i) => (
                                <AccordionItem key={number} value={`faq-${i}`}>
                                    <AccordionTrigger className="text-base">
                                        {text(`faq_${number}_question`)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {text(`faq_${number}_answer`)}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>

                    <section
                        data-reveal
                        id="blog"
                        className="bg-muted/50 py-16"
                    >
                        <div className="mx-auto max-w-7xl px-4">
                            <SectionHeading
                                eyebrow={text('blog_eyebrow')}
                                title={text('blog_title')}
                                text={text('blog_text')}
                            />
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        data-reveal
                        id="newsletter"
                        className="mx-auto max-w-3xl px-4 py-16 text-center"
                    >
                        <h2 className="text-3xl font-bold tracking-tight">
                            {text('newsletter_title')}
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            {text('newsletter_text')}
                        </p>
                        <NewsletterForm />
                    </section>
                </main>

                <SiteFooter />

                <BackToTop onClick={() => scrollTo(0)} />
            </div>
        </>
    );
}
