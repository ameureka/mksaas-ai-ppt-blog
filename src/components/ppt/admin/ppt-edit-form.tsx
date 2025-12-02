'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import { AdminRoutes } from '@/lib/constants/ppt-routes';
import type { PPT, PPTCategory } from '@/lib/types/ppt/ppt';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const pptEditSchema = z.object({
  title: z
    .string()
    .min(1, ADMIN_I18N.validation.titleRequired)
    .max(255, ADMIN_I18N.validation.titleMax),
  category: z.enum([
    'business',
    'product',
    'education',
    'technology',
    'creative',
    'marketing',
    'medical',
    'finance',
    'hr',
    'lifestyle',
    'general',
  ] as const),
  author: z.string().max(100, ADMIN_I18N.validation.authorMax).optional(),
  description: z.string().max(1000, ADMIN_I18N.validation.descMax).optional(),
});

type PPTEditFormValues = z.infer<typeof pptEditSchema>;

const categoryLabels: Record<PPTCategory, string> = {
  business: ADMIN_I18N.categories.business,
  product: ADMIN_I18N.categories.product,
  education: ADMIN_I18N.categories.education,
  technology: ADMIN_I18N.categories.technology,
  creative: ADMIN_I18N.categories.creative,
  marketing: ADMIN_I18N.categories.marketing,
  medical: ADMIN_I18N.categories.medical,
  finance: ADMIN_I18N.categories.finance,
  hr: ADMIN_I18N.categories.hr,
  lifestyle: ADMIN_I18N.categories.lifestyle,
  general: ADMIN_I18N.categories.general,
};

interface PPTEditFormProps {
  ppt: PPT;
}

export function PPTEditForm({ ppt }: PPTEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PPTEditFormValues>({
    resolver: zodResolver(pptEditSchema),
    defaultValues: {
      title: ppt.title,
      category: ppt.category as PPTCategory,
      author: ppt.author || '',
      description: ppt.description || '',
    },
  });

  const onSubmit = async (data: PPTEditFormValues) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('[v0] PPT update data:', data);
      toast.success(ADMIN_I18N.ppt.updateSuccess);
      router.push(AdminRoutes.PPTs);
      router.refresh();
    } catch (error) {
      toast.error(ADMIN_I18N.ppt.updateError);
      console.error('[v0] Update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleLength = form.watch('title')?.length || 0;
  const authorLength = form.watch('author')?.length || 0;
  const descriptionLength = form.watch('description')?.length || 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_I18N.ppt.titleLabel} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={ADMIN_I18N.ppt.titlePlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {titleLength}/255 {ADMIN_I18N.common.chars}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_I18N.ppt.categoryLabel} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={ADMIN_I18N.ppt.categoryPlaceholder}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_I18N.ppt.authorLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={ADMIN_I18N.ppt.authorPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {authorLength}/100 {ADMIN_I18N.common.chars}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_I18N.ppt.descLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={ADMIN_I18N.ppt.descPlaceholder}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {descriptionLength}/1000 {ADMIN_I18N.common.chars}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(AdminRoutes.PPTs)}
                disabled={isSubmitting}
              >
                {ADMIN_I18N.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? ADMIN_I18N.common.saving
                  : ADMIN_I18N.common.saveChanges}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{ADMIN_I18N.ppt.previewInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">PPT ID</div>
              <div className="font-mono text-sm">{ppt.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {ADMIN_I18N.ppt.slidesCount}
              </div>
              <div>
                {ppt.slides_count} {ADMIN_I18N.common.pages}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {ADMIN_I18N.ppt.fileSize}
              </div>
              <div>{ppt.file_size}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {ADMIN_I18N.ppt.uploadTime}
              </div>
              <div>{ppt.uploaded_at}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {ADMIN_I18N.ppt.downloadsLabel}
              </div>
              <div>
                {ppt.downloads} {ADMIN_I18N.common.times}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {ADMIN_I18N.ppt.fileUrl}
              </div>
              <div className="text-sm truncate font-mono" title={ppt.file_url}>
                {ppt.file_url}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
