// components/TermsGateModal.js
import { useState } from "react";
import Link from "next/link";

export default function TermsGateModal({
  role, // "seeker" | "provider"
  onAgree,
}) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  function handleAgree() {
    if (!checked) {
      setError("You must agree to the Terms & Conditions to continue.");
      return;
    }
    onAgree();
  }

  const termsLink =
    role === "provider" ? "/terms/provider" : "/terms/seeker";

  const roleLabel =
    role === "provider" ? "Provider" : "Seeker";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
              color: "#0b1220",
            }}
          >
            Terms & Conditions
          </h2>
          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Please review and accept the {roleLabel} Terms to continue.
          </p>
        </div>

        {/* BODY */}
        <div
          style={{
            padding: "22px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#111827",
              }}
            >
              By continuing, you confirm that you have read, understood, and
              agree to be bound by the ServiceConnect{" "}
              <strong>{roleLabel}</strong> Terms & Conditions.
            </p>

            <p
              style={{
                marginTop: "10px",
                fontSize: "14px",
              }}
            >
              👉{" "}
              <Link
                href={termsLink}
                target="_blank"
                style={{
                  color: "#2563eb",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                View full {roleLabel} Terms & Conditions
              </Link>
            </p>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginTop: "18px",
              fontSize: "14px",
              color: "#111827",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                setChecked(e.target.checked);
                if (e.target.checked) setError("");
              }}
              style={{ marginTop: "3px" }}
            />
            <span>
              I have read and agree to the{" "}
              <strong>{roleLabel} Terms & Conditions</strong>.
            </span>
          </label>

          {error && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() =>
              setError("You must agree to the Terms & Conditions to continue.")
            }
            style={{
              padding: "10px 14px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            I Do Not Agree
          </button>

          <button
            onClick={handleAgree}
            style={{
              padding: "10px 18px",
              background: "#0b1220",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}