let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("qrni_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("qrni_session_id", sessionId);
    }
  }
  return sessionId;
}
