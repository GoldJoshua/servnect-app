import { useRouter } from "next/router";
import RequireSupport from "../../../components/auth/RequireSupport";
import ChatWindow from "../../../components/chat/ChatWindow";

export default function SupportJobChat() {
  const router = useRouter();
  const { jobId } = router.query;

  if (!jobId) return null;

  return (
    <RequireSupport>
      <ChatWindow jobId={jobId} />
    </RequireSupport>
  );
}