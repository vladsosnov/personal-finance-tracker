import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

const DashboardClient = dynamic(
  () => import("@/features/dashboard/components/dashboard-client").then((module) => module.DashboardClient),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

const DashboardPage = () => {
  return <DashboardClient />;
};

export default DashboardPage;
