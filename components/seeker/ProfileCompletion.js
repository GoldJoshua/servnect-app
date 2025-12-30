export default function ProfileCompletion() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <p className="text-sm font-medium">Profile Completion</p>

      <div className="mt-3 bg-gray-200 h-3 rounded-full">
        <div
          className="h-full bg-[#0b1220] rounded-full"
          style={{ width: "40%" }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">40% complete</p>
    </div>
  );
}