import { useLocation } from "react-router";
import ShopCustomerForm from "../../components/shop/forms/ShopCustomerForm";
import type { MyCustomer } from "../../types/shopOwner";

export default function ShopCustomerAddPage() {
  return <ShopCustomerForm mode="add" />;
}

export function ShopCustomerEditPage() {
  const location = useLocation();
  const customer = (location.state as { customer?: MyCustomer } | null)?.customer ?? null;
  return <ShopCustomerForm mode="edit" customer={customer} />;
}
