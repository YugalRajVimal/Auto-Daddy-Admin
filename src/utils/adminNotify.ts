import { toast } from "react-toastify";

/** Snackbar-style feedback for admin portal actions (react-toastify). */
export const adminNotify = {
  success: (message: string) => {
    if (message) toast.success(message);
  },
  error: (message: string) => {
    if (message) toast.error(message);
  },
  info: (message: string) => {
    if (message) toast.info(message);
  },
};
