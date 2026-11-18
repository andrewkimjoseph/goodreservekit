import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CnvLabsLogo } from "../icons/CnvLabsLogo.js";
import { useGoodReserveConfig } from "../provider/GoodReserveProvider.js";
import { themeToStyle } from "../theme/theme.js";
import { styles } from "../styles/styles.js";

export type GoodReserveToastTone = "error" | "success";

export interface GoodReserveToastPayload {
  tone: GoodReserveToastTone;
  message: string;
  dismiss: () => void;
}

export interface GoodReserveToastItem {
  id: number;
  tone: GoodReserveToastTone;
  message: string;
}

const LEAVE_MS = 220;

export function GoodReserveToast({
  item,
  onDismiss,
  renderToast,
  showBranding = true,
}: {
  item: GoodReserveToastItem | null;
  onDismiss: () => void;
  renderToast?: (toast: GoodReserveToastPayload) => ReactNode;
  /** Show the CNV Labs logo on the left. Off falls back to a small tone dot. */
  showBranding?: boolean;
}) {
  const { theme } = useGoodReserveConfig();
  const [open, setOpen] = useState(false);
  const leave = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!item) return;
    let left = false;
    let leaveTimer = 0;
    setOpen(false);
    const frame = requestAnimationFrame(() => setOpen(true));
    const finish = () => {
      if (left) return;
      left = true;
      setOpen(false);
      leaveTimer = window.setTimeout(onDismiss, LEAVE_MS);
    };
    leave.current = finish;
    const timer = window.setTimeout(finish, theme.toast.durationMs);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.clearTimeout(leaveTimer);
      leave.current = null;
    };
  }, [item?.id, onDismiss, theme.toast.durationMs]);

  if (!item || typeof document === "undefined") return null;

  const payload: GoodReserveToastPayload = {
    tone: item.tone,
    message: item.message,
    dismiss: () => leave.current?.(),
  };
  const toneClass = item.tone === "success" ? styles.toastSuccess : styles.toastError;

  return createPortal(
    <div className={styles.toastHost} style={themeToStyle(theme)}>
      <div className={styles.toastSlot} data-open={open ? "true" : "false"}>
        {renderToast ? (
          renderToast(payload)
        ) : (
          <div className={`${styles.toast} ${toneClass}`} role="alert" onClick={payload.dismiss}>
            {showBranding ? (
              <CnvLabsLogo className={styles.toastLogo} aria-hidden="true" role="presentation" />
            ) : (
              <span className={styles.toastMark} aria-hidden="true" />
            )}
            <p title={item.message}>{item.message}</p>
            <button type="button" className={styles.toastClose} aria-label="Dismiss" onClick={payload.dismiss}>
              ×
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
