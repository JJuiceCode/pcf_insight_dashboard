import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import {
  activityRecords,
  emissionFactors,
} from '@/features/emissions/seed';

/**
 * The page itself stays a server component: it only ferries the
 * initial seed data into the client-side `DashboardShell`, which
 * owns the live activity record list and drives every recalculation.
 */
export default function Home() {
  return (
    <AppShell>
      <Header />
      <DashboardShell
        initialActivityRecords={activityRecords}
        emissionFactors={emissionFactors}
      />
    </AppShell>
  );
}
