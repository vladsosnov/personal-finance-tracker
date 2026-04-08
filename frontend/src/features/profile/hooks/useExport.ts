import { useLazyQuery } from "@apollo/client/react";
import { EXPORT_ALL_DATA } from "@/features/dashboard/gql/dashboard";
import { showToast } from "@/shared/lib/toast-store";
import { trackEvent } from "@/shared/lib/analytics";

export const useExport = () => {
  const [exportAllDataQuery, { loading: isExportingAllData }] = useLazyQuery<{ exportAllData: string }>(EXPORT_ALL_DATA, {
    fetchPolicy: "no-cache",
  });

  const handleExportAllData = async () => {
    trackEvent("data_exported");
    try {
      const result = await exportAllDataQuery();
      const payload = result.data?.exportAllData;
      if (!payload) throw new Error("Nothing to export");

      const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial-goals-tracker-export-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast("Exported all goals and operations.", "teal");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to export data", "red");
    }
  };

  return {
    isExportingAllData,
    handleExportAllData,
  };
};
