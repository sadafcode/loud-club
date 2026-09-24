import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/nav";
import { Newsletter } from "./newsletter";

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="gutter grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="eyebrow text-lime">The Club List</p>
          <p className="display mt-4 text-4xl md:text-5xl">
            First look at every drop, <em>before</em> it sells out.
          </p>
          <div className="mt-8 max-w-md">
            <Newsletter />
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-6 md:col-start-7">
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className="eyebrow text-paper/50">{group.title}</p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-paper/85 hover:text-lime">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="gutter overflow-hidden">
        <p aria-hidden className="display select-none whitespace-nowrap text-[26vw] leading-[0.8] tracking-[-0.05em] text-paper/[0.07] md:text-[21vw]">
          loud <em>club</em>
        </p>
      </div>

      <div className="border-t border-paper/10">
        <div className="gutter flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} loud club. A portfolio concept store — no real orders are placed.</p>
          <p>Photography via Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
