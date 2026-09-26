import {
    Award,
    Book,
    Bot,
    Briefcase,
    CreditCard,
    FilePenLine,
    GitCompareArrows,
    GraduationCap,
    Globe,
    LayoutDashboard,
    Library,
    Newspaper,
    Palette,
    School,
    Settings,
    ShoppingBag,
    Users,
    UserRoundCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboard } from '@/routes';
import { maintenance, section as adminSection } from '@/routes/admin';
import { show as settingsShow } from '@/routes/admin/settings';
import { edit as profileEdit } from '@/routes/profile';
import { index as mediaIndex } from '@/routes/admin/media';
import { index as languagesIndex } from '@/routes/admin/languages';
import { index as usersIndex } from '@/routes/admin/users';
import { index as newslettersIndex } from '@/routes/admin/newsletters';
import certificateTemplates from '@/routes/admin/certificates/certificate';
import marksheetTemplates from '@/routes/admin/certificates/marksheet';
import { gateways as billingGateways } from '@/routes/admin/billing';
import billingPayments from '@/routes/admin/billing/payments';
import billingPayouts from '@/routes/admin/billing/payouts';
import { show as instructorApplication } from '@/routes/instructor-application';
import instructorPayouts from '@/routes/instructor/payouts';
import {
    create as blogsCreate,
    index as blogsIndex,
} from '@/routes/admin/blogs';
import { index as collectionsIndex } from '@/routes/admin/collections';
import {
    create as jobCircularsCreate,
    index as jobCircularsIndex,
} from '@/routes/admin/job-circulars';
import {
    applications as instructorApplications,
    create as instructorsCreate,
    index as instructorsIndex,
} from '@/routes/admin/instructors';
import { index as pagesIndex } from '@/routes/admin/pages';
import { index as courseCategoriesIndex } from '@/routes/admin/course-categories';
import { index as couponsIndex } from '@/routes/admin/course-coupons';
import { index as examCouponsIndex } from '@/routes/admin/exam-coupons';
import { index as examResultsIndex } from '@/routes/admin/exam-attempts';
import { index as examEnrollmentsIndex } from '@/routes/admin/exam-enrollments';
import { index as enrollmentsIndex } from '@/routes/admin/course-enrollments';
import {
    create as examsCreate,
    index as examsIndex,
} from '@/routes/admin/exams';
import { index as productCouponsIndex } from '@/routes/admin/product-coupons';
import {
    create as productsCreate,
    index as productsIndex,
    sales as productsSales,
} from '@/routes/admin/products';
import {
    create as adminCoursesCreate,
    index as adminCoursesIndex,
} from '@/routes/admin/courses';

export type AdminNavLink = { title: string; href: string };

export type AdminNavItem = {
    title: string;
    icon: LucideIcon;
    /** A direct link, or… */
    href?: string;
    /** …a collapsible group of links. */
    items?: AdminNavLink[];
};

/**
 * The admin sidebar menu, in the Mentor demo's order. Titles are English keys, translated where rendered.
 */
export const adminNav: AdminNavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, href: dashboard.url() },
    {
        title: 'Courses',
        icon: School,
        items: [
            { title: 'Manage courses', href: adminCoursesIndex.url() },
            { title: 'Create course', href: adminCoursesCreate.url() },
            { title: 'Categories', href: courseCategoriesIndex.url() },
            { title: 'Coupons', href: couponsIndex.url() },
            { title: 'Enrollments', href: enrollmentsIndex.url() },
        ],
    },
    {
        title: 'Exams',
        icon: Book,
        items: [
            // Categories are shared by courses, exams and the store.
            { title: 'Categories', href: courseCategoriesIndex.url() },
            { title: 'Manage exams', href: examsIndex.url() },
            { title: 'Create exam', href: examsCreate.url() },
            { title: 'Coupons', href: examCouponsIndex.url() },
            { title: 'Enrollments', href: examEnrollmentsIndex.url() },
            { title: 'Results', href: examResultsIndex.url() },
        ],
    },
    {
        title: 'Store',
        icon: ShoppingBag,
        items: [
            { title: 'Categories', href: courseCategoriesIndex.url() },
            { title: 'Manage products', href: productsIndex.url() },
            { title: 'Create product', href: productsCreate.url() },
            { title: 'Product coupons', href: productCouponsIndex.url() },
            { title: 'Product sales', href: productsSales.url() },
        ],
    },
    {
        title: 'Blogs',
        icon: FilePenLine,
        items: [
            { title: 'Categories', href: courseCategoriesIndex.url() },
            { title: 'Create blog', href: blogsCreate.url() },
            { title: 'Manage blogs', href: blogsIndex.url() },
        ],
    },
    {
        title: 'Frontend',
        icon: Palette,
        items: [
            { title: 'Pages', href: pagesIndex.url() },
            { title: 'Home collections', href: collectionsIndex.url() },
        ],
    },
    {
        title: 'Job Circulars',
        icon: Briefcase,
        items: [
            { title: 'All jobs', href: jobCircularsIndex.url() },
            { title: 'Create job', href: jobCircularsCreate.url() },
        ],
    },
    {
        title: 'Instructors',
        icon: UserRoundCog,
        items: [
            { title: 'Applications', href: instructorApplications.url() },
            { title: 'Manage instructors', href: instructorsIndex.url() },
            { title: 'Create instructor', href: instructorsCreate.url() },
        ],
    },
    {
        title: 'Billings',
        icon: CreditCard,
        items: [
            { title: 'Configuration', href: billingGateways.url() },
            { title: 'Online payments', href: billingPayments.online.url() },
            { title: 'Offline payments', href: billingPayments.offline.url() },
            { title: 'Payout request', href: billingPayouts.requests.url() },
            { title: 'Payout history', href: billingPayouts.history.url() },
        ],
    },
    {
        title: 'Certificate',
        icon: Award,
        items: [
            { title: 'Certificate', href: certificateTemplates.index.url() },
            { title: 'Marksheet', href: marksheetTemplates.index.url() },
        ],
    },
    {
        title: 'AI Assistant',
        icon: Bot,
        href: adminSection.url('ai-assistant'),
    },
    {
        title: 'Newsletters',
        icon: Newspaper,
        href: newslettersIndex.url(),
    },
    { title: 'All Users', icon: Users, href: usersIndex.url() },
    {
        title: 'Translation',
        icon: Globe,
        href: languagesIndex.url(),
    },
    {
        title: 'Media Library',
        icon: Library,
        href: mediaIndex.url(),
    },
    {
        title: 'Settings',
        icon: Settings,
        items: [
            { title: 'Account', href: profileEdit.url() },
            { title: 'System', href: settingsShow.url('system') },
            { title: 'Storage', href: settingsShow.url('storage') },
            { title: 'SMTP', href: settingsShow.url('smtp') },
            { title: 'Auth', href: settingsShow.url('auth') },
            { title: 'Analytics', href: settingsShow.url('analytics') },
        ],
    },
    {
        title: 'Maintenance',
        icon: GitCompareArrows,
        href: maintenance.url(),
    },
];

/**
 * The sidebar for signed-in users who are not admins.
 */
export const memberNav: AdminNavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, href: dashboard.url() },
    {
        title: 'Become an instructor',
        icon: GraduationCap,
        href: instructorApplication.url(),
    },
];

/**
 * The sidebar for approved instructors, following the demo's "Login as Instructor": the same pages as
 * admins, showing only their own courses, exams, products, posts and files.
 */
export const instructorNav: AdminNavItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, href: dashboard.url() },
    {
        title: 'Courses',
        icon: School,
        items: [
            { title: 'Manage courses', href: adminCoursesIndex.url() },
            { title: 'Create course', href: adminCoursesCreate.url() },
            { title: 'Enrollments', href: enrollmentsIndex.url() },
        ],
    },
    {
        title: 'Exams',
        icon: Book,
        items: [
            { title: 'Manage exams', href: examsIndex.url() },
            { title: 'Create exam', href: examsCreate.url() },
            { title: 'Enrollments', href: examEnrollmentsIndex.url() },
        ],
    },
    {
        title: 'Store',
        icon: ShoppingBag,
        items: [
            { title: 'Manage products', href: productsIndex.url() },
            { title: 'Create product', href: productsCreate.url() },
            { title: 'Product sales', href: productsSales.url() },
        ],
    },
    {
        title: 'Blogs',
        icon: FilePenLine,
        items: [
            { title: 'Create blog', href: blogsCreate.url() },
            { title: 'Manage blogs', href: blogsIndex.url() },
        ],
    },
    {
        title: 'Billings',
        icon: CreditCard,
        items: [
            { title: 'Withdraw', href: instructorPayouts.index.url() },
            { title: 'Settings', href: instructorPayouts.settings.url() },
        ],
    },
    { title: 'Media Library', icon: Library, href: mediaIndex.url() },
    {
        title: 'Settings',
        icon: Settings,
        items: [{ title: 'Account', href: profileEdit.url() }],
    },
];

/**
 * Finds the menu entry for a URL: the item itself and, for group links, the group it belongs to.
 */
export function findAdminNav(
    url: string,
): { item: AdminNavItem; link?: AdminNavLink } | null {
    for (const item of adminNav) {
        if (item.href === url) {
            return { item };
        }

        const link = item.items?.find((entry) => entry.href === url);

        if (link) {
            return { item, link };
        }
    }

    return null;
}
