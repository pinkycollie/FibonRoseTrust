import { TrustScoreOverview } from "@/components/dashboard/TrustScoreOverview";
import { VerificationModules } from "@/components/dashboard/VerificationModules";
import { DataTransparency } from "@/components/dashboard/DataTransparency";
import { VerificationHistory } from "@/components/dashboard/VerificationHistory";

export default function Dashboard() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-6">
          <TrustScoreOverview />
        </div>

        <div className="mt-8">
          <VerificationModules />
        </div>

        <div className="mt-8">
          <DataTransparency />
        </div>

        <div className="mt-8 mb-8">
          <VerificationHistory />
        </div>
      </div>
    </div>
  );
}
