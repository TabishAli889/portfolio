"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2, Save, Trash2 } from "lucide-react";
import { deleteResource, saveResource } from "@/lib/actions";
import {
  RESOURCES,
  type FieldDescriptor,
  type ResourceKey,
} from "@/lib/resources";
import { MediaField } from "./fields/MediaField";
import { KeyValueListField, StringListField } from "./fields/ListField";
import { ConfirmButton } from "./ConfirmButton";

/**
 * One form for every content type, rendered from the field descriptors in
 * lib/resources.ts and validated with that resource's Zod schema - the same
 * schema the server action re-validates against.
 *
 * `refOptions` is resolved on the server and passed in, so the client never
 * needs its own data-fetching path.
 */

type Props = {
  /**
   * Only the key crosses the RSC boundary. A Zod schema is not serializable,
   * so the form reads its own config - fields, labels and schema - out of the
   * client-safe registry instead of receiving it as a prop.
   */
  resourceKey: ResourceKey;
  id: string | null;
  initialValues: Record<string, unknown>;
  refOptions: Record<string, { value: string; label: string }[]>;
};

/** Defaults by field type, for a brand-new document. */
function emptyFor(field: FieldDescriptor): unknown {
  switch (field.type) {
    case "boolean":
      return field.name === "published" ? true : false;
    case "number":
      return field.min ?? 0;
    case "stringList":
    case "tags":
    case "keyValueList":
      return [];
    default:
      return "";
  }
}

export function ResourceForm({
  resourceKey,
  id,
  initialValues,
  refOptions,
}: Props) {
  const config = RESOURCES[resourceKey];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  const defaultValues = Object.fromEntries(
    config.fields.map((field) => {
      const current = initialValues[field.name];
      return [
        field.name,
        current === undefined || current === null ? emptyFor(field) : current,
      ];
    }),
  );

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<FieldValues>({
    resolver: zodResolver(config.schema) as Resolver<FieldValues>,
    defaultValues,
    mode: "onBlur",
  });

  /**
   * List fields are edited as raw text, so entries arrive with stray
   * whitespace and blank lines. Normalise once here rather than per keystroke.
   */
  function cleanValues(values: FieldValues): Record<string, unknown> {
    const out: Record<string, unknown> = { ...values };

    for (const field of config.fields) {
      const value = out[field.name];

      if (
        (field.type === "stringList" || field.type === "tags") &&
        Array.isArray(value)
      ) {
        out[field.name] = value
          .map((entry) => String(entry).trim())
          .filter((entry) => entry.length > 0);
      }

      if (field.type === "keyValueList" && Array.isArray(value)) {
        out[field.name] = (value as { label?: string; value?: string }[])
          .map((row) => ({
            label: (row.label ?? "").trim(),
            value: (row.value ?? "").trim(),
          }))
          .filter((row) => row.label !== "" || row.value !== "");
      }

      if (typeof value === "string") {
        out[field.name] = field.type === "markdown" ? value : value.trim();
      }
    }

    return out;
  }

  function onSubmit(values: FieldValues) {
    startTransition(async () => {
      const result = await saveResource(config.key, id, cleanValues(values));

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [name, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(name, { type: "server", message: messages[0] });
            }
          }
        }
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Saved.");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);

      if (config.singleton) {
        // Keep the user on the page; just mark the form clean again.
        reset(values, { keepValues: true });
        router.refresh();
        return;
      }

      if (id) {
        reset(values, { keepValues: true });
        router.refresh();
      } else {
        router.push(`/admin/${config.slug}`);
      }
    });
  }

  function onDelete() {
    if (!id) return;
    startTransition(async () => {
      const result = await deleteResource(config.key, id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Deleted.");
      router.push(`/admin/${config.slug}`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="glass p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {config.fields.map((field) => {
            const error = errors[field.name];
            const errorId = `${field.name}-error`;
            const helpId = `${field.name}-help`;
            const describedBy =
              [error ? errorId : null, field.help ? helpId : null]
                .filter(Boolean)
                .join(" ") || undefined;

            return (
              <div
                key={field.name}
                className={field.half ? "sm:col-span-1" : "sm:col-span-2"}
              >
                {field.type === "boolean" ? (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-700 bg-ink-900/50 p-3.5 transition-colors hover:border-ink-600">
                    <input
                      type="checkbox"
                      disabled={isPending}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-neon-cyan"
                      aria-describedby={describedBy}
                      {...register(field.name)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-fog-100">
                        {field.label}
                      </span>
                      {field.help && (
                        <span
                          id={helpId}
                          className="mt-0.5 block text-xs text-fog-500"
                        >
                          {field.help}
                        </span>
                      )}
                    </span>
                  </label>
                ) : (
                  <>
                    {/*
                      `keyValueList` has no single input to point at - it is a
                      set of paired rows - so it gets a group label rather than
                      a `for`/`id` association that would resolve to nothing.
                    */}
                    {field.type === "keyValueList" ? (
                      <span className="label" id={`field-${field.name}-label`}>
                        {field.label}
                      </span>
                    ) : (
                      <label className="label" htmlFor={`field-${field.name}`}>
                        {field.label}
                      </label>
                    )}

                    {renderControl({
                      field,
                      control,
                      register,
                      isPending,
                      refOptions,
                      describedBy,
                      invalid: Boolean(error),
                    })}

                    {field.help && !error && (
                      <p id={helpId} className="mt-1.5 text-xs text-fog-500">
                        {field.help}
                      </p>
                    )}
                  </>
                )}

                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="mt-1.5 text-xs text-rose-300"
                  >
                    {String(error.message ?? "This field is invalid.")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky action bar, so Save is always reachable in a long form. */}
      <div className="glass-blur sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/92 px-4 py-3">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving
            </>
          ) : justSaved ? (
            <>
              <Check className="size-4" aria-hidden />
              Saved
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              {id || config.singleton
                ? "Save changes"
                : `Create ${config.singular.toLowerCase()}`}
            </>
          )}
        </button>

        {isDirty && !isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
            <span
              aria-hidden
              className="size-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_8px_1px_rgba(252,211,77,0.7)]"
            />
            Unsaved changes
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!config.singleton && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => router.push(`/admin/${config.slug}`)}
              className="btn btn-ghost !py-2 !text-xs"
            >
              Cancel
            </button>
          )}

          {id && !config.singleton && (
            <ConfirmButton
              onConfirm={onDelete}
              disabled={isPending}
              label="Delete"
              confirmLabel="Click again to delete"
              className="btn btn-danger !py-2 !text-xs"
              icon={<Trash2 className="size-3.5" aria-hidden />}
            />
          )}
        </div>
      </div>
    </form>
  );
}

function renderControl({
  field,
  control,
  register,
  isPending,
  refOptions,
  describedBy,
  invalid,
}: {
  field: FieldDescriptor;
  /* react-hook-form's generic Control is not worth threading through here. */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  register: any;
  isPending: boolean;
  refOptions: Record<string, { value: string; label: string }[]>;
  describedBy?: string;
  invalid: boolean;
}) {
  const id = `field-${field.name}`;
  const common = {
    id,
    disabled: isPending,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    placeholder: field.placeholder,
    className: `field ${invalid ? "field-error" : ""}`,
  };

  switch (field.type) {
    case "textarea":
    case "markdown":
      return (
        <textarea
          {...common}
          rows={field.rows ?? 4}
          className={`${common.className} resize-y ${field.type === "markdown" ? "font-mono !text-[0.85rem] leading-relaxed" : ""}`}
          {...register(field.name)}
        />
      );

    case "number":
      return (
        <input
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          {...register(field.name, { valueAsNumber: true })}
        />
      );

    case "url":
      return (
        <input
          {...common}
          type="url"
          inputMode="url"
          {...register(field.name)}
        />
      );

    case "email":
      return (
        <input
          {...common}
          type="email"
          inputMode="email"
          {...register(field.name)}
        />
      );

    case "slug":
      return (
        <input
          {...common}
          type="text"
          spellCheck={false}
          className={`${common.className} font-mono !text-[0.85rem]`}
          {...register(field.name)}
        />
      );

    case "ref": {
      const options = refOptions[field.refResource ?? ""] ?? [];
      return (
        <select
          {...common}
          className={`${common.className} cursor-pointer`}
          {...register(field.name)}
        >
          <option value="">
            {options.length
              ? "Select one"
              : "No options yet - create one first"}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    case "image":
    case "pdf":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: controlled }) => (
            <MediaField
              id={id}
              kind={field.type === "pdf" ? "pdf" : "image"}
              value={String(controlled.value ?? "")}
              onChange={controlled.onChange}
              disabled={isPending}
              describedBy={describedBy}
            />
          )}
        />
      );

    case "stringList":
    case "tags":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: controlled }) => (
            <StringListField
              id={id}
              value={
                Array.isArray(controlled.value)
                  ? controlled.value.map(String)
                  : []
              }
              onChange={controlled.onChange}
              rows={field.rows ?? (field.type === "tags" ? 3 : 6)}
              placeholder={field.placeholder}
              disabled={isPending}
              describedBy={describedBy}
              splitOnCommas={field.type === "tags"}
              invalid={invalid}
            />
          )}
        />
      );

    case "keyValueList":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: controlled }) => (
            <div role="group" aria-labelledby={`field-${field.name}-label`}>
              <KeyValueListField
                value={
                  Array.isArray(controlled.value)
                    ? (controlled.value as { label: string; value: string }[])
                    : []
                }
                onChange={controlled.onChange}
                disabled={isPending}
              />
            </div>
          )}
        />
      );

    default:
      return <input {...common} type="text" {...register(field.name)} />;
  }
}
