export type Category = {
    id: number;
    name: string;
    slug: string;
    icon: string;
    courses_count: number;
};

/** A category as listed in a catalog sidebar, with the number of courses or exams in it. */
export type CatalogCategory = Omit<Category, 'courses_count'> & {
    items_count: number;
};

export type Course = {
    id: number;
    title: string;
    slug: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    short_description: string | null;
    image_url: string | null;
    price: string;
    compare_at_price: string | null;
    duration_minutes: number;
    students_count: number;
    rating: string;
    reviews_count: number;
    category: Pick<Category, 'id' | 'icon'>;
};

export type Instructor = {
    id: number;
    name: string;
    title: string;
    avatar_url: string | null;
};

export type Post = {
    id: number;
    title: string;
    slug: string;
    image_url: string | null;
    author_name: string;
    read_minutes: number;
    published_at: string;
};

export type PostDetail = Post & {
    excerpt: string | null;
    keywords: string | null;
    /** Sanitized rich-text HTML. */
    body: string | null;
    banner_url: string | null;
    category: Omit<Category, 'courses_count'> | null;
};

export type Exam = {
    id: number;
    title: string;
    slug: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    short_description: string | null;
    image_url: string | null;
    price: string;
    compare_at_price: string | null;
    duration_minutes: number;
    questions_count: number;
    pass_percentage: number;
    max_attempts: number;
    students_count: number;
    rating: string;
    reviews_count: number;
    category: Pick<Category, 'id' | 'icon'>;
    instructor: Pick<Instructor, 'id' | 'name'> | null;
};

export type Product = {
    id: number;
    title: string;
    slug: string;
    type: string;
    format: string;
    summary: string | null;
    image_url: string | null;
    price: string;
    compare_at_price: string | null;
    /** Null means unlimited. */
    stock: number | null;
    sales_count: number;
    rating: string;
    reviews_count: number;
    category: Pick<Category, 'id' | 'icon'>;
    instructor: Pick<Instructor, 'id' | 'name'> | null;
};

export type JobOpening = {
    id: number;
    title: string;
    slug: string;
    location: string;
    job_type: string;
    work_type: string;
    experience_level: string;
    positions: number;
    /** Y-m-d */
    deadline: string;
};

export type JobOpeningDetail = JobOpening & {
    description: string;
    skills: string[];
    salary_min: number | null;
    salary_max: number | null;
    currency: string;
    apply_email: string;
};
