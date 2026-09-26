import { Head, router, useForm, usePage } from '@inertiajs/react';
import { EllipsisVertical, Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Field } from '@/components/admin/course-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import userRoutes from '@/routes/admin/users';

type Role = 'admin' | 'instructor' | 'student';

type UserRow = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    role: Role;
    created_at: string;
};

type Filters = { search?: string; role?: Role; per_page?: number };

const ROLE_LABEL: Record<Role, string> = {
    admin: 'Admin',
    instructor: 'Instructor',
    student: 'Student',
};

/**
 * All Users, following the Mentor demo: name, status, role and actions, with an edit dialog.
 */
export default function Users({
    users,
    filters,
    roles,
}: {
    users: Paginator & { data: UserRow[] };
    filters: Filters;
    roles: Role[];
}) {
    const { t } = useTranslation();
    const getInitials = useInitials();
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [deleting, setDeleting] = useState<UserRow | null>(null);

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            userRoutes.index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t('Users')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Users')}
                </h1>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('User list')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <form
                                role="search"
                                className="relative w-full md:w-64"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    applyFilters({ search });
                                }}
                            >
                                <Search
                                    className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    type="search"
                                    placeholder={t('Search')}
                                    aria-label={t('Search users')}
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="ps-9"
                                />
                            </form>
                            <Select
                                value={String(filters.per_page ?? 10)}
                                onValueChange={(value) =>
                                    applyFilters({ per_page: Number(value) })
                                }
                            >
                                <SelectTrigger
                                    className="w-20"
                                    aria-label={t('Rows per page')}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 text-start font-medium">
                                        {t('Name')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="-ms-3 font-medium"
                                                >
                                                    {filters.role
                                                        ? t(
                                                              ROLE_LABEL[
                                                                  filters.role
                                                              ],
                                                          )
                                                        : t('Role')}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuRadioGroup
                                                    value={filters.role ?? ''}
                                                    onValueChange={(value) =>
                                                        applyFilters({
                                                            role:
                                                                (value as Role) ||
                                                                undefined,
                                                        })
                                                    }
                                                >
                                                    <DropdownMenuRadioItem value="">
                                                        {t('All roles')}
                                                    </DropdownMenuRadioItem>
                                                    {roles.map((role) => (
                                                        <DropdownMenuRadioItem
                                                            key={role}
                                                            value={role}
                                                        >
                                                            {t(
                                                                ROLE_LABEL[
                                                                    role
                                                                ],
                                                            )}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => {
                                    const isSelf = user.id === auth.user?.id;

                                    return (
                                        <tr
                                            key={user.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10">
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                user.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {user.name}
                                                            {isSelf && (
                                                                <span className="ms-2 text-xs text-muted-foreground">
                                                                    ({t('you')})
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    variant={
                                                        user.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {user.is_active
                                                        ? t('Active')
                                                        : t('Inactive')}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                {t(ROLE_LABEL[user.role])}
                                            </td>
                                            <td className="px-6 py-3 text-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-full"
                                                            aria-label={t(
                                                                'Actions for :name',
                                                                {
                                                                    name: user.name,
                                                                },
                                                            )}
                                                        >
                                                            <EllipsisVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setEditing(user)
                                                            }
                                                        >
                                                            <Pencil />
                                                            {t('Edit')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            disabled={isSelf}
                                                            onSelect={() =>
                                                                setDeleting(
                                                                    user,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                            {t('Delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={users} />
                </Card>
            </div>

            {editing && (
                <EditUserDialog
                    user={editing}
                    roles={roles}
                    isSelf={editing.id === auth.user?.id}
                    onClose={() => setEditing(null)}
                />
            )}
            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('Delete this user?')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    ':name’s account, enrolments, orders and payments will be deleted. To keep their records, make them inactive instead.',
                                    { name: deleting.name },
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(
                                        userRoutes.destroy.url(deleting.id),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setDeleting(null),
                                        },
                                    )
                                }
                            >
                                {t('Delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

Users.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: userRoutes.index() },
    ],
};

function EditUserDialog({
    user,
    roles,
    isSelf,
    onClose,
}: {
    user: UserRow;
    roles: Role[];
    isSelf: boolean;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
    });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(userRoutes.update.url(user.id), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t('Edit user')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('Change the name, email, role or status.')}
                        </DialogDescription>
                    </DialogHeader>
                    <Field
                        label={t('Name')}
                        htmlFor="name"
                        required
                        error={form.errors.name}
                    >
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Email')}
                        htmlFor="email"
                        required
                        error={form.errors.email}
                    >
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Role')}
                        htmlFor="role"
                        required
                        error={form.errors.role}
                    >
                        <Select
                            value={form.data.role}
                            onValueChange={(value) =>
                                form.setData('role', value as Role)
                            }
                            disabled={isSelf}
                        >
                            <SelectTrigger
                                id="role"
                                className="h-10 w-full rounded-lg"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {t(ROLE_LABEL[role])}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={form.data.is_active}
                            disabled={isSelf}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked === true)
                            }
                        />
                        <Label htmlFor="is_active">
                            {t('Active (can sign in)')}
                        </Label>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Save changes')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
