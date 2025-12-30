// components/Button.js
export default function Button({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "px-6 py-3 rounded-xl font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed " +
        (disabled
          ? "bg-gray-200 text-gray-500"
          : "bg-gradient-to-r from-[#0b1220] to-[#394651] text-white") +
        " " + className
      }
    >
      {children}
    </button>
  );
}