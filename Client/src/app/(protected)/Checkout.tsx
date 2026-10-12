import { useEffect, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router";
import CheckoutHeader from "../../components/CheckoutHeader";
import Footer from "../../components/Footer";
import OrderItemRow from "../../components/OrderItemRow";
import { useAuth } from "../../context/auth.context";
import { useCartCount } from "../../context/cart.context";
import { toApiError } from "../../lib/api_error";
import { sellingPrice, usd } from "../../lib/format";
import { shippingAddressSchema, type ShippingAddressInput } from "../../schemas/checkout.schema";
import { getCart, type Cart } from "../../services/cart.service";
import { placeOrder, type PaymentMethod } from "../../services/order.service";

// same rounding as the server: money to 2 decimal places
const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const inputClass =
  "w-full rounded-[9px] border border-line bg-white px-3.5 py-3 text-sm leading-[1.2] text-ink placeholder:text-subtle outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

const PAYMENT_OPTIONS: { value: PaymentMethod; title: string; text: string }[] = [
  { value: "upi", title: "UPI", text: "Pay using any UPI app" },
  { value: "card", title: "Credit / debit card", text: "Visa, Mastercard, RuPay" },
  { value: "cod", title: "Cash on delivery", text: "Pay when your order arrives" },
];

// ---------- Small pieces ----------

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
      <h2 className="text-base leading-[1.2] font-bold">{title}</h2>
      {children}
    </section>
  );
}

// the design's radio: 20px circle, thick orange ring when selected
function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-5 shrink-0 rounded-full bg-white ${checked ? "border-[5.5px] border-brand" : "border-[1.4px] border-line"}`}
    />
  );
}

// the error sits outside the <label> (so it isn't read as part of the field's name) and is linked to the input
// with aria-describedby via `errorId`
function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.75">
      <label className="flex flex-col gap-1.75">
        <span className="text-[13px] leading-none font-medium text-muted">{label}</span>
        {children}
      </label>
      {error && <span id={errorId} role="alert" className="text-xs text-danger">{error}</span>}
    </div>
  );
}

function SummaryRow({ label, value, valueClass = "text-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm leading-[1.3]">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// ---------- Page ----------

export default function Checkout() {
  const { user } = useAuth();
  const { refreshCount } = useCartCount();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
    mode: "onTouched",
    defaultValues: {
      name: user ? `${user.first_name} ${user.last_name}` : "",
      house_no: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  // live form values for the "Delivering to" box (hook, so it must run before the early return below)
  const address = useWatch({ control });

  useEffect(() => {
    let ignore = false;
    getCart()
      .then((c) => !ignore && setCart(c))
      .catch((err) => !ignore && setLoadError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, []);

  if (cart && cart.items.length === 0) return <Navigate to="/cart" replace />;

  // priced exactly like the server will price the order
  const lines = (cart?.items ?? []).map((item) => ({
    item,
    unit: roundMoney(sellingPrice(item.price, item.discount)),
  }));
  const units = lines.reduce((sum, l) => sum + l.item.quantity, 0);
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.item.price * l.item.quantity, 0));
  const total = roundMoney(lines.reduce((sum, l) => sum + l.unit * l.item.quantity, 0));
  const discount = Math.max(0, roundMoney(subtotal - total));

  const deliveringTo = [address.name, address.house_no, address.address_line_1, address.address_line_2, address.city, address.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  const onSubmit = async (data: ShippingAddressInput) => {
    try {
      const { order, payment } = await placeOrder({ ...data, address_line_2: data.address_line_2 || undefined }, paymentMethod);
      if (payment) {
        // UPI / card: pay first; the cart is kept until the payment is verified
        navigate(`/pay/${order._id}`, { replace: true });
        return;
      }
      void refreshCount(); // COD empties the cart → badge back to 0
      navigate(`/order/${order._id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setError("root", { message: toApiError(err).message });
    }
  };

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <CheckoutHeader />

      <main className="mx-auto max-w-300 px-4 pt-8 pb-20 xl:px-0">
        {loadError && (
          <p role="alert" className="mb-5 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
            {loadError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Left */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
            <Card title="Delivery address">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field errorId="name-error" label="Full name" error={errors.name?.message}>
                  <input className={inputClass} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />
                </Field>
                <Field errorId="house_no-error" label="House / flat no." error={errors.house_no?.message}>
                  <input className={inputClass} placeholder="42" aria-invalid={!!errors.house_no} aria-describedby={errors.house_no ? "house_no-error" : undefined} {...register("house_no")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field errorId="address_line_1-error" label="Address" error={errors.address_line_1?.message}>
                    <input
                      className={inputClass}
                      autoComplete="address-line1"
                      placeholder="Street, area"
                      aria-invalid={!!errors.address_line_1} aria-describedby={errors.address_line_1 ? "address_line_1-error" : undefined}
                      {...register("address_line_1")}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field errorId="address_line_2-error" label="Address line 2 (optional)" error={errors.address_line_2?.message}>
                    <input
                      className={inputClass}
                      autoComplete="address-line2"
                      placeholder="Landmark, building"
                      aria-invalid={!!errors.address_line_2} aria-describedby={errors.address_line_2 ? "address_line_2-error" : undefined}
                      {...register("address_line_2")}
                    />
                  </Field>
                </div>
                <Field errorId="city-error" label="City" error={errors.city?.message}>
                  <input className={inputClass} autoComplete="address-level2" aria-invalid={!!errors.city} aria-describedby={errors.city ? "city-error" : undefined} {...register("city")} />
                </Field>
                <Field errorId="state-error" label="State" error={errors.state?.message}>
                  <input className={inputClass} autoComplete="address-level1" aria-invalid={!!errors.state} aria-describedby={errors.state ? "state-error" : undefined} {...register("state")} />
                </Field>
                <Field errorId="pincode-error" label="Pincode" error={errors.pincode?.message}>
                  <input className={inputClass} autoComplete="postal-code" inputMode="numeric" aria-invalid={!!errors.pincode} aria-describedby={errors.pincode ? "pincode-error" : undefined} {...register("pincode")} />
                </Field>
                <Field errorId="country-error" label="Country" error={errors.country?.message}>
                  <input className={inputClass} autoComplete="country-name" aria-invalid={!!errors.country} aria-describedby={errors.country ? "country-error" : undefined} {...register("country")} />
                </Field>
              </div>
            </Card>

            <Card title="Delivery options">
              <div className="flex items-center gap-3.5 rounded-[10px] border-[1.5px] border-brand bg-brand/5 px-4 py-3.5">
                <Radio checked />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm leading-[1.2] font-semibold">Standard delivery</span>
                  <span className="text-[13px] leading-[1.3] text-muted">Arrives in 3–5 days</span>
                </div>
                <span className="text-sm font-semibold text-success">FREE</span>
              </div>
            </Card>

            <Card title="Payment method">
              <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3.5">
                {PAYMENT_OPTIONS.map((option) => {
                  const checked = paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => setPaymentMethod(option.value)}
                      className={`flex items-center gap-3.5 rounded-[10px] px-4 py-3.5 text-left transition ${
                        checked ? "border-[1.5px] border-brand bg-brand/5" : "border border-line bg-white hover:border-ink"
                      }`}
                    >
                      <Radio checked={checked} />
                      <span className="flex flex-1 flex-col gap-1">
                        <span className="text-sm leading-[1.2] font-semibold">{option.title}</span>
                        <span className="text-[13px] leading-[1.3] text-muted">{option.text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {errors.root && (
              <p role="alert" className="w-full rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
                {errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!cart || isSubmitting}
              className="w-full rounded-[10px] bg-brand px-5.5 py-3.5 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Placing order..."
                : `${paymentMethod === "cod" ? "Place order" : "Continue to payment"}  ·  ${usd.format(total)}`}
            </button>
            <p className="w-full text-center text-xs leading-[1.5] text-subtle">
              By placing this order you agree to Shopistan’s Terms of Service and Return Policy.
            </p>
          </div>

          {/* Right */}
          <aside className="flex w-full shrink-0 flex-col gap-4.5 lg:w-95">
            <section className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-5">
              <h2 className="text-[17px] leading-[1.2] font-bold">Order summary</h2>
              <div className="h-px bg-line" />
              {cart ? (
                lines.map(({ item, unit }) => (
                  <OrderItemRow
                    key={item._id}
                    name={item.name}
                    quantity={item.quantity}
                    lineTotal={roundMoney(unit * item.quantity)}
                    image={item.image}
                  />
                ))
              ) : (
                <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
              )}
              <div className="h-px bg-line" />
              <SummaryRow label={`Subtotal (${units} ${units === 1 ? "item" : "items"})`} value={usd.format(subtotal)} />
              {discount > 0 && <SummaryRow label="Discount" value={`− ${usd.format(discount)}`} valueClass="text-success" />}
              <SummaryRow label="Delivery" value="FREE" valueClass="text-success" />
              <div className="h-px bg-line" />
              <div className="flex items-center justify-between text-base leading-[1.3] font-bold">
                <span>Total payable</span>
                <span>{usd.format(total)}</span>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4.5">
              <span className="text-[11px] leading-[1.2] font-semibold tracking-[0.66px] text-subtle uppercase">Delivering to</span>
              <p className={`text-sm leading-[1.5] ${deliveringTo ? "text-ink" : "text-subtle"}`}>
                {deliveringTo || "Enter your address on the left"}
              </p>
            </section>
          </aside>
        </form>
      </main>

      <Footer />
    </div>
  );
}
