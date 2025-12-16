export const NewsletterCTA = () => {
  return (
    <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] p-10 text-white shadow-glass-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-white/70">Stay briefed</p>
          <h3 className="mt-2 text-4xl font-semibold leading-tight">Weekly AI Signals</h3>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Get curated AI intelligence, funding rounds, and research breakthroughs in one elegant digest.
          </p>
        </div>
        <form className="flex w-full flex-col gap-3 text-sm text-slate-900 lg:max-w-md">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-full border border-white/40 bg-white/95 px-6 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/70"
          />
          <button
            type="submit"
            className="rounded-full bg-white px-6 py-3 text-base font-semibold uppercase tracking-[0.4em] text-[hsl(var(--gradient-start))] transition hover:bg-white/90"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};
