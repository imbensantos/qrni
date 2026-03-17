let sessionId = null;
export function getSessionId() {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('qrni_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('qrni_session_id', sessionId);
    }
  }
  return sessionId;
}
