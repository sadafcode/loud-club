"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="flex items-center gap-2 border-b border-paper/30 pb-3 text-lg">
        <Check className="size-5 text-lime" /> You&apos;re on the list. First drop lands in your inbox.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="flex items-center gap-3 border-b border-paper/30 pb-3 focus-within:border-lime"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Your email"
        className="w-full bg-transparent text-lg outline-none placeholder:text-paper/40"
      />
      <button type="submit" aria-label="Subscribe" className="rounded-full bg-lime p-2.5 text-ink transition-transform hover:translate-x-0.5">
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
