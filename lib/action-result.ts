/**
 * The single shape every server action returns.
 *
 * Client-safe (no imports) because the admin forms narrow on it to decide
 * between a success toast and inline field errors.
 */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | {
      ok: false
      error: string
      /** Keyed by form field name, matching react-hook-form paths. */
      fieldErrors?: Record<string, string[] | undefined>
    }

export function actionOk<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message }
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors }
}
