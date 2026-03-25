import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AdminLogsClient = dynamic(
  () => import("@/features/admin/components/admin-logs-client").then((m) => m.AdminLogsClient),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Admin Logs - Financial Goals Tracker",
};

const AdminLogsPage = () => <AdminLogsClient />;

export default AdminLogsPage;
