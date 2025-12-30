// components/Input.js
export default function Input({
  label,
  value,
  onChange,
  type = "text",
  required = true
}) {
  return (
    <div className="relative w-full mb-6">
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="
          w-full px-4 py-3 
          bg-gray-50 
          border border-gray-200 
          rounded-xl 
          text-gray-900 
          focus:outline-none 
          focus:ring-2 
          focus:ring-gray-900 
          transition-all
        "
        placeholder=" "
      />

      <label
        className="
          absolute left-4 top-3 
          text-gray-500 pointer-events-none 
          transition-all 
        peer-placeholder-shown:top-3 
        peer-placeholder-shown:text-gray-400 
        peer-focus:-top-3 
        peer-focus:text-xs 
        peer-focus:text-gray-900
      "
      >
        {label}
      </label>
    </div>
  );
}