// UI ONLY – SAFE
// Seeker Wallet Page
// Sidebar retired
// Bottom navigation handled by canonical SeekerLayout

import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";

export default function SeekerWalletPage() {
  return (
    <RequireRole role="seeker">
      <SeekerLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#07102a] mb-4">
            Wallet
          </h1>

          <div className="bg-white rounded-xl p-6 shadow">
            <p className="text-gray-600">
              Wallet functionality will be enabled soon.
            </p>
          </div>
        </div>
      </SeekerLayout>
    </RequireRole>
  );
}