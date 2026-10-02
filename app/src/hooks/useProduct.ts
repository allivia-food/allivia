import { queryOptions, useQuery } from '@tanstack/react-query';

import { getProduct } from '@/services/products';

export const productKey = (barcode: string) => ['product', barcode] as const;

export const productQuery = (barcode: string) =>
  queryOptions({
    queryKey: productKey(barcode),
    queryFn: () => getProduct(barcode),
    staleTime: Infinity,
    networkMode: 'always',
  });

export function useProduct(barcode: string) {
  return useQuery({ ...productQuery(barcode), enabled: barcode.length > 0 });
}
