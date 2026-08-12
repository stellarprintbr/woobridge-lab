export function money(n: number): string {
  return n.toFixed(2);
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function paginate<T>(
  items: T[],
  params: URLSearchParams
): { page: number; perPage: number; total: number; totalPages: number; slice: T[] } {
  let page = parseInt(params.get("page") ?? "1", 10);
  let perPage = parseInt(params.get("per_page") ?? "10", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(perPage) || perPage < 1) perPage = 10;
  if (perPage > 100) perPage = 100;

  const offsetParam = params.get("offset");
  const offset = offsetParam ? parseInt(offsetParam, 10) : (page - 1) * perPage;

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const slice = items.slice(offset, offset + perPage);

  return { page, perPage, total, totalPages, slice };
}

export function sortItems<T>(
  items: T[],
  orderby: string | null,
  order: string | null,
  fieldMap: Record<string, keyof T>
): T[] {
  const field = fieldMap[orderby ?? "date"] ?? fieldMap["date"];
  const dir = order === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    return av! > bv! ? dir : -dir;
  });
}
