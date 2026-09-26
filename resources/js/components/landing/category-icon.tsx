import {
    Activity,
    Apple,
    Baby,
    Bone,
    BookOpen,
    Brain,
    Briefcase,
    ChartLine,
    Dna,
    Dumbbell,
    Eye,
    Flower2,
    GraduationCap,
    HeartPulse,
    Hospital,
    Landmark,
    LayoutGrid,
    Leaf,
    Microscope,
    Pill,
    Salad,
    Sprout,
    Stethoscope,
    Syringe,
    Users,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Icons a category can use, keyed by the value stored in categories.icon. The admin icon picker offers this set.
 */
export const categoryIcons: Record<string, LucideIcon> = {
    briefcase: Briefcase,
    hospital: Hospital,
    stethoscope: Stethoscope,
    pill: Pill,
    leaf: Leaf,
    sprout: Sprout,
    flower: Flower2,
    apple: Apple,
    'heart-pulse': HeartPulse,
    brain: Brain,
    activity: Activity,
    microscope: Microscope,
    syringe: Syringe,
    dna: Dna,
    eye: Eye,
    bone: Bone,
    baby: Baby,
    salad: Salad,
    dumbbell: Dumbbell,
    'graduation-cap': GraduationCap,
    'book-open': BookOpen,
    'chart-line': ChartLine,
    landmark: Landmark,
    users: Users,
    'layout-grid': LayoutGrid,
};

export function CategoryIcon({
    name,
    ...props
}: LucideProps & { name: string }) {
    const Icon = categoryIcons[name] ?? BookOpen;

    return <Icon {...props} />;
}
