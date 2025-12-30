// components/provider/ProviderNavItem.js
import { useRouter } from "next/router";

export default function ProviderNavItem({
  icon: Icon,
  label,
  href,
  onClick,
  activePaths = [],
}) {
  const router = useRouter();
  const isActive = activePaths.some((p) => router.pathname.startsWith(p));

  const handleClick = () => {
    if (onClick) return onClick();
    if (href) router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-1 text-xs ${
        isActive ? "text-[#4F6D8A]" : "text-[#9AA4AF]"
      }`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}