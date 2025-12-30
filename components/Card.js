// components/Card.js
export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white shadow-xl rounded-2xl p-8 
        border border-gray-100 
        backdrop-blur-xl 
        ${className}
      `}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
      }}
    >
      {children}
    </div>
  );
}