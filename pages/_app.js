// pages/_app.js
import "@/styles/globals.css";
import useAuthListener from "../hooks/useAuthListener";

export default function App({ Component, pageProps }) {
  useAuthListener(); // 👈 realtime auth listener (safe)
  return <Component {...pageProps} />;
}