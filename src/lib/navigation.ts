export type PageView = "sales" | "sales_history" | "inventory" | "cash_register" | "expense_management" | "payment_methods" | "logs" | "bulk_edit";

export const OPERADOR_PAGES: PageView[] = ["sales", "sales_history", "inventory", "bulk_edit"];

export function canAccessPage(page: PageView, userRol: "admin" | "operador" | string): boolean {
  if (userRol === "admin") return true;
  return OPERADOR_PAGES.includes(page);
}
