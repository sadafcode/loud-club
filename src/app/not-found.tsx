import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="gutter flex flex-1 flex-col items-start justify-center py-24">
      <p className="eyebrow text-muted">Error 404</p>
      <h1 className="display mt-6 text-[clamp(4rem,12vw,11rem)]">
        Too <em>quiet</em> here.
      </h1>
      <p className="mt-6 max-w-md text-muted">
        This page doesn&apos;t exist — or it sold out before you got here. Either way, the good stuff is this way.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/shop" size="lg">
          Shop everything
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">
          Back home
        </ButtonLink>
      </div>
    </section>
  );
}
