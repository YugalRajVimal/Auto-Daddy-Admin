const BASE_ADMIN = `${import.meta.env.VITE_API_URL}/api/admin`;

// ---------- Types ----------

export type ExpenseSubcategoryApi = { _id?: string; name: string };

export type ExpenseCategoryApiRow = {
  _id: string;
  name: string;
  subcategories: ExpenseSubcategoryApi[];
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseCategoryCreatePayload = {
  name: string;
  subcategories?: string[];
};

export type ExpenseCategoryUpdatePayload = {
  name?: string;
  subcategories?: string[];
};

// ---------- Helpers ----------

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) {
    const message = body?.message || body?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

// ---------- Expense Category API calls ----------
// Base path: /api/admin/accounts/expenses-category

// GET /accounts/expenses-category
export async function fetchExpenseCategories(): Promise<ExpenseCategoryApiRow[]> {
  const res = await fetch(`${BASE_ADMIN}/accounts/expenses-category`, {
    method: "GET",
    credentials: "include",
  });
  const body = await handleResponse<{ data?: ExpenseCategoryApiRow[] } | ExpenseCategoryApiRow[]>(res);
  return Array.isArray(body) ? body : body.data ?? [];
}

// POST /accounts/expenses-category
export async function addExpenseCategory(
  payload: ExpenseCategoryCreatePayload
): Promise<ExpenseCategoryApiRow> {
  const res = await fetch(`${BASE_ADMIN}/accounts/expenses-category`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      subcategories: payload.subcategories ?? [],
    }),
  });
  const body = await handleResponse<{ data?: ExpenseCategoryApiRow } | ExpenseCategoryApiRow>(res);
  return (body as any).data ?? (body as ExpenseCategoryApiRow);
}

// PUT /accounts/expenses-category/:id
export async function editExpenseCategory(
  id: string,
  payload: ExpenseCategoryUpdatePayload
): Promise<ExpenseCategoryApiRow> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.subcategories !== undefined) body.subcategories = payload.subcategories;

  const res = await fetch(`${BASE_ADMIN}/accounts/expenses-category/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const resBody = await handleResponse<{ data?: ExpenseCategoryApiRow } | ExpenseCategoryApiRow>(res);
  return (resBody as any).data ?? (resBody as ExpenseCategoryApiRow);
}

// DELETE /accounts/expenses-category/:id
export async function removeExpenseCategory(id: string): Promise<void> {
  const res = await fetch(`${BASE_ADMIN}/accounts/expenses-category/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<unknown>(res);
}