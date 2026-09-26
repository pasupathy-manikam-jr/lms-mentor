import {
    CircleUserRound,
    GraduationCap,
    Heart,
    LayoutGrid,
    Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboard } from '@/routes';
import {
    courses as learningCourses,
    wishlist as learningWishlist,
} from '@/routes/learning';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export type AccountMenuItem = { label: string; href: string; icon: LucideIcon };

/**
 * The avatar menu's links for a user's roles, as in the Mentor demo (Logout comes after them):
 * admins get Dashboard; instructors Dashboard and their learning pages; students the learning pages.
 */
export function accountMenuItems(roles: string[]): AccountMenuItem[] {
    const isAdmin = roles.includes('admin');
    const isInstructor = roles.includes('instructor');

    return [
        ...(isAdmin || isInstructor
            ? [{ label: 'Dashboard', href: dashboard.url(), icon: LayoutGrid }]
            : []),
        ...(isAdmin
            ? []
            : [
                  {
                      label: 'My courses',
                      href: learningCourses.url(),
                      icon: GraduationCap,
                  },
                  {
                      label: 'Wishlist',
                      href: learningWishlist.url(),
                      icon: Heart,
                  },
                  {
                      label: 'Profile',
                      href: editProfile.url(),
                      icon: CircleUserRound,
                  },
                  {
                      label: 'Settings',
                      href: editSecurity.url(),
                      icon: Settings,
                  },
              ]),
    ];
}
