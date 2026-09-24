export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  items: T[]; // Backward compatibility for existing frontend callers expecting items
  pagination: PaginationMeta;
  [key: string]: any;
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number | string = 1,
  limit: number | string = 20,
  extra: Record<string, any> = {},
): PaginatedResult<T> {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const totalPages = Math.ceil(total / safeLimit) || (total === 0 ? 0 : 1);

  return {
    data,
    items: data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
    ...extra,
  };
}
