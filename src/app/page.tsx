import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';

const PLACEHOLDERS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'Dashboard summary',
    body: 'Dashboard summary will be added in the next step.',
  },
  {
    title: 'Emissions overview',
    body: 'Emissions overview will be added in the next step.',
  },
  {
    title: 'Activity verification',
    body: 'Activity verification table will be added in the next step.',
  },
];

export default function Home() {
  return (
    <AppShell>
      <Header />

      <section
        aria-label="Dashboard content"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDERS.map((item) => (
            <PlaceholderCard
              key={item.title}
              title={item.title}
              body={item.body}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
        />
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Coming next
        </p>
      </div>
      <h2 className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {body}
      </p>
    </article>
  );
}
