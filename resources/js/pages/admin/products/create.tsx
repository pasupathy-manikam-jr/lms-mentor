import { Head } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    CoursePricingFields,
    ImageField,
} from '@/components/admin/course-form';
import {
    ProductDetailFields,
    ProductStockField,
    ProductTextFields,
    submitProductForm,
    useProductForm,
} from '@/components/admin/product-form';
import type { ProductFormOptions } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, index } from '@/routes/admin/products';

/**
 * Create Product, following the Mentor demo. Saving opens the editor to add gallery images and the
 * downloadable files.
 */
export default function CreateProduct(options: ProductFormOptions) {
    const { t } = useTranslation();
    const form = useProductForm(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        submitProductForm(form);
    };

    return (
        <>
            <Head title={t('Create product')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Create product')}
                </h1>
                <Card className="p-6">
                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 gap-6 md:grid-cols-2"
                    >
                        <div className="min-w-0 space-y-6">
                            <ProductTextFields form={form} />
                        </div>
                        <div className="min-w-0 space-y-6">
                            <ProductDetailFields
                                form={form}
                                options={options}
                            />
                            <CoursePricingFields
                                form={form}
                                priceLabel={t('Enter your product price ($0)')}
                                showExpiry={false}
                            />
                            <ProductStockField form={form} />
                            <ImageField
                                form={form}
                                name="thumbnail"
                                label={t('Thumbnail')}
                                currentUrl={null}
                            />
                        </div>
                        <div className="text-end md:col-span-2">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Create product')}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}

CreateProduct.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: index() },
        { title: 'Create product', href: create() },
    ],
};
