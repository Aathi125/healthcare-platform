import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const TOAST_TIMEOUT = 4200;

const createToastRecord = (input) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: input.title || "Notification",
  message: input.message || "",
  type: input.type || "info"
});

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="status"
        >
          <div className="toast__body">
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button
            type="button"
            className="toast__dismiss"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            x
          </button>
        </article>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = (toastId) => {
    const timer = timersRef.current.get(toastId);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const pushToast = (input) => {
    const toast = createToastRecord(input);

    setToasts((current) => [...current, toast]);

    const timer = window.setTimeout(() => {
      dismissToast(toast.id);
    }, TOAST_TIMEOUT);

    timersRef.current.set(toast.id, timer);
    return toast.id;
  };

  const value = useMemo(
    () => ({
      toast: pushToast,
      success: (title, message = "") => pushToast({ type: "success", title, message }),
      error: (title, message = "") => pushToast({ type: "error", title, message }),
      info: (title, message = "") => pushToast({ type: "info", title, message })
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
