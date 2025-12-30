import { useRouter } from "next/router";

export default function SummaryCard({ title, value, link }) {
  const router = useRouter();

  return (
    <div
      className="p-6 bg-white rounded-2xl shadow cursor-pointer hover:shadow-lg transition"
      onClick={() => router.push(link)}
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
    </div>
  );
}