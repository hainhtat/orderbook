import { Button, Column, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { Screen } from '@/components/Screen';
import type { Product } from '@/features/products/product-types';
import {
  useCategories,
  useCreateProduct,
  useUpdateProduct,
} from '@/features/products/use-products';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type ProductFormValues = {
  sku: string;
  name: string;
  priceMMK: string;
  stockQty: string;
  lowStockAt: string;
  imageUrl: string;
  categoryId: string;
};

type ProductFormScreenProps = {
  mode: 'create' | 'edit';
  product?: Product;
};

const NO_CATEGORY = '__none__';

export function ProductFormScreen({ mode, product }: ProductFormScreenProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? '');
  const { data: categories = [] } = useCategories();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      priceMMK: product ? String(product.priceMMK) : '',
      stockQty: product ? String(product.stockQty) : '0',
      lowStockAt:
        product?.lowStockAt !== null && product?.lowStockAt !== undefined
          ? String(product.lowStockAt)
          : '',
      imageUrl: product?.imageUrl ?? '',
      categoryId: product?.categoryId ?? NO_CATEGORY,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const isPending = createProduct.isPending || updateProduct.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (!/^\d+$/.test(values.priceMMK)) {
      setFormError(t('products.invalidAmount'));
      return;
    }

    const priceMMK = Number(values.priceMMK);
    const lowStockAt = values.lowStockAt.trim() ? Number(values.lowStockAt) : undefined;
    const imageUrl = values.imageUrl.trim() || undefined;
    const categoryId =
      values.categoryId === NO_CATEGORY ? (mode === 'edit' ? null : undefined) : values.categoryId;

    try {
      if (mode === 'create') {
        if (!/^\d+$/.test(values.stockQty)) {
          setFormError(t('products.invalidAmount'));
          return;
        }
        const result = await createProduct.mutateAsync({
          sku: values.sku.trim(),
          name: values.name.trim(),
          priceMMK,
          stockQty: Number(values.stockQty),
          lowStockAt,
          imageUrl,
          categoryId: categoryId || undefined,
        });
        router.replace(`/products/${result.product.id}`);
        return;
      }

      const result = await updateProduct.mutateAsync({
        sku: values.sku.trim(),
        name: values.name.trim(),
        priceMMK,
        lowStockAt: lowStockAt ?? null,
        imageUrl: imageUrl ?? null,
        categoryId,
      });
      router.replace(`/products/${result.product.id}`);
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
      } else {
        setFormError(t('common.error'));
      }
    }
  });

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <Column spacing={20} style={styles.form}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {mode === 'create' ? t('products.createTitle') : t('products.editTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>
              {mode === 'create' ? t('products.createSubtitle') : t('products.editSubtitle')}
            </Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('products.nameRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="product-name"
                  placeholder={t('products.name')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.name ? <FormError message={errors.name.message} /> : null}

            <Controller
              control={control}
              name="sku"
              rules={{ required: t('products.skuRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="product-sku"
                  placeholder={t('products.sku')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                />
              )}
            />
            {errors.sku ? <FormError message={errors.sku.message} /> : null}

            <Controller
              control={control}
              name="priceMMK"
              rules={{ required: t('products.priceRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="product-price"
                  placeholder={t('products.priceMMK')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />
            {errors.priceMMK ? <FormError message={errors.priceMMK.message} /> : null}

            {mode === 'create' ? (
              <Controller
                control={control}
                name="stockQty"
                rules={{ required: t('products.stockRequired') }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    testID="product-stock"
                    placeholder={t('products.initialStock')}
                    defaultValue={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                )}
              />
            ) : null}

            <Controller
              control={control}
              name="lowStockAt"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="product-low-stock"
                  placeholder={t('products.lowStockThresholdOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="imageUrl"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="product-image-url"
                  placeholder={t('products.imageUrlOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                />
              )}
            />

            {categories.length > 0 ? (
              <Column spacing={8}>
                <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
                  {t('products.category')}
                </Text>
                <View style={styles.categoryRow}>
                  <CategoryChip
                    label={t('products.noCategory')}
                    selected={selectedCategoryId === NO_CATEGORY}
                    colors={colors}
                    onPress={() => setValue('categoryId', NO_CATEGORY)}
                  />
                  {categories.map((category) => (
                    <CategoryChip
                      key={category.id}
                      label={category.name}
                      selected={selectedCategoryId === category.id}
                      colors={colors}
                      onPress={() => setValue('categoryId', category.id)}
                    />
                  ))}
                </View>
              </Column>
            ) : null}
          </Column>

          <FormError message={formError} />

          <Button
            testID="product-submit"
            label={isPending ? t('common.loading') : t('common.save')}
            onPress={() => void onSubmit()}
            disabled={isPending}
          />

          {isPending ? <ActivityIndicator color={colors.primary} /> : null}
        </Column>
      </KeyboardAvoidingView>
    </Screen>
  );
}

type CategoryChipProps = {
  label: string;
  selected: boolean;
  colors: {
    primary: string;
    text: string;
    border: string;
    surface: string;
  };
  onPress: () => void;
};

function CategoryChip({ label, selected, colors, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.surface,
        },
      ]}>
      <Text
        textStyle={{
          color: selected ? '#fff' : colors.text,
          fontSize: 13,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    paddingTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
