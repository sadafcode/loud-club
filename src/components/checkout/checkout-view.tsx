"use client";

import { Loader2, Lock, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { useUnavailable } from "@/components/cart/cart-view";
import { PromoField, TotalsTable } from "@/components/cart/order-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { imageUrl } from "@/lib/catalog";
import { DELIVERY, orderTotals, type DeliveryMethod } from "@/lib/checkout";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cartTotals, useCart } from "@/store/cart";
import { useOrders } from "@/store/orders";
import { getStock, useStockStore } from "@/store/stock";

type Fields = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

const EMPTY: Fields = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postcode: "",
  country: "United States",
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

const DEMO: Fields = {
  email: "demo@loudclub.shop",
  firstName: "Alex",
  lastName: "Rivera",
  address: "18 Mercer Street, Apt 4",
  city: "New York, NY",
  postcode: "10013",
  country: "United States",
  cardName: "Alex Rivera",
  cardNumber: "4242 4242 4242 4242",
  expiry: "08 / 29",
  cvc: "123",
};

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "Pakistan",
];

const digits = (v: string) => v.replace(/\D/g, "");
const formatCard = (v: string) => digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};

function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = "Enter a valid email";
  if (!f.firstName.trim()) errors.firstName = "Required";
  if (!f.lastName.trim()) errors.lastName = "Required";
  if (f.address.trim().length < 5) errors.address = "Enter your street address";
  if (!f.city.trim()) errors.city = "Required";
  if (f.postcode.trim().length < 3) errors.postcode = "Required";
  if (!f.cardName.trim()) errors.cardName = "Name as it appears on the card";
  if (digits(f.cardNumber).length !== 16) errors.cardNumber = "Card number should be 16 digits";

  const [mm, yy] = [Number(digits(f.expiry).slice(0, 2)), Number(digits(f.expiry).slice(2, 4))];
  const now = new Date();
  const expired = 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
  if (digits(f.expiry).length !== 4 || mm < 1 || mm > 12) errors.expiry = "Use MM / YY";
  else if (expired) errors.expiry = "This card has expired";

  if (!/^\d{3,4}$/.test(f.cvc)) errors.cvc = "3 or 4 digits";
  return errors;
}

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const promo = useCart((s) => s.promo);
  const clear = useCart((s) => s.clear);
  const place = useOrders((s) => s.place);
  const reserve = useStockStore((s) => s.reserve);

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [delivery, setDelivery] = useState<DeliveryMethod>("standard");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "placed">("idle");
  const [failure, setFailure] = useState<string>();

  const { lines, subtotal, count } = cartTotals(hydrated ? items : []);
  const totals = orderTotals(subtotal, { promo, delivery });
  const unavailable = useUnavailable(lines);
  const errors = submitted ? validate(fields) : {};

  const set = (key: keyof Fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFailure(undefined);
    if (Object.keys(validate(fields)).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    if (unavailable.length > 0) return;

    setStatus("processing");
    await new Promise((r) => setTimeout(r, 1400));

    // Stock can move while "payment" is processing — take it all or nothing.
    if (lines.some((l) => getStock(l.sku) < l.quantity)) {
      setStatus("idle");
      setFailure("Something in your bag just sold out. Review your bag and try again.");
      return;
    }
    for (const l of lines) reserve(l.sku, l.quantity);

    const order = place({
      email: fields.email.trim(),
      lines: lines.map((l) => ({ sku: l.sku, productId: l.productId, quantity: l.quantity, price: l.price })),
      shipping: totals.shipping,
      discount: totals.discount,
      tax: totals.tax,
      delivery,
      customer: {
        name: `${fields.firstName.trim()} ${fields.lastName.trim()}`,
        address: fields.address.trim(),
        city: fields.city.trim(),
        postcode: fields.postcode.trim(),
        country: fields.country,
      },
      cardLast4: digits(fields.cardNumber).slice(-4),
    });
    setStatus("placed");
    clear();
    router.replace(`/checkout/success?order=${order.id}`);
  };

  if (!hydrated) return <div className="gutter min-h-[70vh]" aria-busy="true" />;

  if (status === "placed" || status === "processing") {
    return (
      <div className="gutter flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center" role="status">
        <Loader2 className="size-8 animate-spin text-cobalt" strokeWidth={1.5} />
        <p className="display text-5xl">{status === "placed" ? "Order placed." : "Placing your order…"}</p>
        <p className="text-sm text-muted">Don&apos;t close this tab.</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="gutter flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <h1 className="display text-6xl">Nothing to check out.</h1>
        <ButtonLink href="/shop" size="lg">
          Back to the shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="gutter pt-10 pb-24 md:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6">
        <h1 className="display text-6xl md:text-8xl">Checkout</h1>
        <button
          type="button"
          onClick={() => setFields(DEMO)}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm text-ink hover:bg-ink hover:text-lime"
        >
          <Sparkles className="size-4" strokeWidth={1.5} />
          Fill demo details
        </button>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-12">
        <form onSubmit={onSubmit} noValidate className="space-y-12 lg:col-span-7">
          <Section index="01" title="Contact">
            <Field label="Email" error={errors.email} className="sm:col-span-2">
              <Input type="email" autoComplete="email" value={fields.email} onChange={set("email")} invalid={!!errors.email} />
            </Field>
          </Section>

          <Section index="02" title="Shipping address">
            <Field label="First name" error={errors.firstName}>
              <Input autoComplete="given-name" value={fields.firstName} onChange={set("firstName")} invalid={!!errors.firstName} />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <Input autoComplete="family-name" value={fields.lastName} onChange={set("lastName")} invalid={!!errors.lastName} />
            </Field>
            <Field label="Address" error={errors.address} className="sm:col-span-2">
              <Input autoComplete="street-address" value={fields.address} onChange={set("address")} invalid={!!errors.address} />
            </Field>
            <Field label="City" error={errors.city}>
              <Input autoComplete="address-level2" value={fields.city} onChange={set("city")} invalid={!!errors.city} />
            </Field>
            <Field label="Postcode" error={errors.postcode}>
              <Input autoComplete="postal-code" value={fields.postcode} onChange={set("postcode")} invalid={!!errors.postcode} />
            </Field>
            <Field label="Country" className="sm:col-span-2">
              <select
                value={fields.country}
                onChange={(e) => set("country")(e.target.value)}
                autoComplete="country-name"
                className="h-12 w-full rounded-xl border border-line bg-transparent px-4 text-sm outline-none focus:border-ink"
              >
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </Section>

          <Section index="03" title="Delivery">
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
              {(Object.keys(DELIVERY) as DeliveryMethod[]).map((key) => {
                const option = DELIVERY[key];
                const price = option.price(subtotal);
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-5 transition-colors",
                      delivery === key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={key}
                      checked={delivery === key}
                      onChange={() => setDelivery(key)}
                      className="sr-only"
                    />
                    <span>
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className={cn("mt-1 block text-xs", delivery === key ? "text-paper/70" : "text-muted")}>
                        {option.eta}
                      </span>
                    </span>
                    <span className={cn("text-sm tabular-nums", price === 0 && delivery === key && "text-lime")}>
                      {price === 0 ? "Free" : formatPrice(price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Section index="04" title="Payment">
            <p className="flex items-start gap-2 rounded-2xl bg-concrete px-4 py-3 text-xs text-muted sm:col-span-2">
              <Lock className="mt-px size-3.5 shrink-0 text-ink" />
              This is a portfolio demo — no payment is taken. Use any 16-digit number, e.g. 4242 4242 4242 4242.
            </p>
            <Field label="Name on card" error={errors.cardName} className="sm:col-span-2">
              <Input autoComplete="cc-name" value={fields.cardName} onChange={set("cardName")} invalid={!!errors.cardName} />
            </Field>
            <Field label="Card number" error={errors.cardNumber} className="sm:col-span-2">
              <Input
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={fields.cardNumber}
                onChange={(v) => set("cardNumber")(formatCard(v))}
                invalid={!!errors.cardNumber}
                className="tabular-nums tracking-wider"
              />
            </Field>
            <Field label="Expiry" error={errors.expiry}>
              <Input
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YY"
                value={fields.expiry}
                onChange={(v) => set("expiry")(formatExpiry(v))}
                invalid={!!errors.expiry}
              />
            </Field>
            <Field label="CVC" error={errors.cvc}>
              <Input
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={fields.cvc}
                onChange={(v) => set("cvc")(digits(v).slice(0, 4))}
                invalid={!!errors.cvc}
              />
            </Field>
          </Section>

          <div className="space-y-4 border-t border-line pt-8">
            {(failure || unavailable.length > 0) && (
              <p className="rounded-2xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">
                {failure ?? "Some pieces sold out while they were in your bag."}{" "}
                <Link href="/cart" className="underline underline-offset-4">
                  Review bag
                </Link>
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={unavailable.length > 0}>
              <Lock className="size-4" /> Pay {formatPrice(totals.total)}
            </Button>
            <p className="text-center text-xs text-muted">
              By placing your order you agree to our terms. Free 30-day returns on everything.
            </p>
          </div>
        </form>

        <aside className="order-first lg:order-none lg:col-span-5">
          <div className="space-y-6 rounded-3xl border border-line p-6 md:p-8 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">Your order</h2>
              <Link href="/cart" className="text-xs underline underline-offset-4 hover:text-cobalt">
                Edit bag ({count})
              </Link>
            </div>
            <ul className="max-h-72 space-y-4 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.sku} className="flex items-center gap-4">
                  <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-stone">
                    <Image src={imageUrl(l.image)} alt={l.name} fill sizes="56px" className="object-cover" />
                    <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] leading-4 text-paper">
                      {l.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{l.name}</p>
                    <p className="text-xs text-muted">
                      {l.color} · {l.size === "OS" ? "One size" : l.size}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">{formatPrice(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <PromoField />
            <TotalsTable totals={totals} shippingLabel={`${DELIVERY[delivery].label} shipping`} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="flex items-baseline gap-3">
        <span className="eyebrow text-cobalt">{index}</span>
        <span className="display text-3xl md:text-4xl">{title}</span>
      </legend>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="eyebrow mb-2 block text-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-signal">{error}</span>}
    </label>
  );
}

function Input({
  invalid,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "onChange"> & { invalid?: boolean; onChange: (value: string) => void }) {
  return (
    <input
      {...props}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-ink",
        invalid ? "border-signal" : "border-line",
        className,
      )}
    />
  );
}
