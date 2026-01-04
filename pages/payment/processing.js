import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PaymentProcessing() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/provider/subscription");
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Processing your payment…</h2>
      <p>Please wait. Do not refresh.</p>
    </div>
  );
}