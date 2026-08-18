// Keeps raw Postgres / provider errors out of user-facing toasts.
// The real error is logged server-side; the user sees a clean message.

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function fail(error: unknown, userMessage: string = DEFAULT_MESSAGE): never {
  try {
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
    console.error("[server error]", detail);
  } catch {
    console.error("[server error]", error);
  }
  throw new Error(userMessage);
}

export const SAVE_FAILED = "Couldn't save your changes. Please try again.";
export const LOAD_FAILED = "Couldn't load that right now. Please try again.";
