import { useEffect, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toApiError } from "../lib/api_error";
import { productFormSchema, type ProductFormInput } from "../schemas/product.schema";
import { getCategories, getDepartments, type Category, type Department } from "../services/dashboard.service";
import { createProduct, getProductDetails, updateProduct, type SavedProduct } from "../services/product.service";

const inputClass =
  "w-full rounded-[9px] border border-line bg-white px-3.5 py-3 text-sm leading-[1.2] text-ink placeholder:text-subtle outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger disabled:bg-surface disabled:text-muted";

function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.75">
      <label className="flex flex-col gap-1.75">
        <span className="text-[13px] leading-none font-medium text-muted">{label}</span>
        {children}
      </label>
      {error && <span id={errorId} role="alert" className="text-xs text-danger">{error}</span>}
    </div>
  );
}

type ProductFormModalProps = {
  productId?: string;
  onClose: () => void;
  onSaved: (product: SavedProduct) => void;
};

export default function ProductFormModal({ productId, onClose, onSaved }: ProductFormModalProps) {
  const isEdit = Boolean(productId);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  // remembers which department it was fetched for, so a slow response can't show the wrong list
  const [categoryList, setCategoryList] = useState<{ departmentId: string; categories: Category[] } | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEdit);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: "", image: "", discount: 0, department_id: "", category_id: "", description: "" },
  });

  const departmentId = useWatch({ control, name: "department_id" });
  const image = useWatch({ control, name: "image" });

  // departments for the first dropdown
  useEffect(() => {
    let ignore = false;
    getDepartments()
      .then((list) => !ignore && setDepartments(list))
      .catch((err) => !ignore && setServerError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, []);

  // edit: fill the form with the product as it is now
  useEffect(() => {
    if (!productId) return;
    let ignore = false;
    getProductDetails(productId)
      .then(({ product, department_details }) => {
        if (ignore) return;
        reset({
          name: product.name,
          image: product.image,
          price: product.price,
          discount: product.discount,
          department_id: department_details?._id ?? "",
          category_id: product.category_id,
          description: product.description ?? "",
        });
      })
      .catch((err) => !ignore && setServerError(toApiError(err).message))
      .finally(() => !ignore && setIsLoadingProduct(false));
    return () => {
      ignore = true;
    };
  }, [productId, reset]);

  // categories of the chosen department
  useEffect(() => {
    if (!departmentId) return;
    let ignore = false;
    getCategories(departmentId)
      .then((categories) => !ignore && setCategoryList({ departmentId, categories }))
      .catch((err) => !ignore && setServerError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [departmentId]);

  // Escape closes (not while saving)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isSubmitting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isSubmitting, onClose]);

  const categories = categoryList?.departmentId === departmentId ? categoryList.categories : null;
  const showPreview = /^https?:\/\/\S+$/.test(image?.trim() ?? "");

  const onSubmit = async (values: ProductFormInput) => {
    setServerError(null);
    // department_id only picks the category list; the server doesn't take it
    const input = {
      name: values.name,
      image: values.image,
      price: values.price,
      discount: values.discount,
      category_id: values.category_id,
      description: values.description || undefined,
    };
    try {
      const saved = productId ? await updateProduct(productId, input) : await createProduct(input);
      onSaved(saved);
    } catch (err) {
      setServerError(toApiError(err).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 px-4 py-8 font-sans text-ink"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="w-full max-w-xl rounded-2xl bg-white shadow-[0_24px_64px_rgba(17,24,39,0.24)]"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="product-form-title" className="text-lg font-bold">{isEdit ? "Edit product" : "Add product"}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-[9px] text-muted transition hover:bg-surface hover:text-ink disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {isLoadingProduct ? (
          <div className="flex flex-col gap-4 p-6">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-[9px] bg-gray-100" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 p-6">
            <Field label="Product name" errorId="product-name-error" error={errors.name?.message}>
              <input className={inputClass} aria-invalid={!!errors.name} aria-describedby={errors.name ? "product-name-error" : undefined} {...register("name")} />
            </Field>

            <div className="flex items-start gap-3">
              <div className="grid size-19 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gray-100 p-1.5">
                {showPreview && <img src={image.trim()} alt="Preview" className="max-h-full max-w-full object-contain mix-blend-multiply" />}
              </div>
              <div className="flex-1">
                <Field label="Image link" errorId="product-image-error" error={errors.image?.message}>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className={inputClass}
                    aria-invalid={!!errors.image}
                    aria-describedby={errors.image ? "product-image-error" : undefined}
                    {...register("image")}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (USD)" errorId="product-price-error" error={errors.price?.message}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  className={inputClass}
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "product-price-error" : undefined}
                  {...register("price", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Discount (%)" errorId="product-discount-error" error={errors.discount?.message}>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  inputMode="numeric"
                  className={inputClass}
                  aria-invalid={!!errors.discount}
                  aria-describedby={errors.discount ? "product-discount-error" : undefined}
                  {...register("discount", { valueAsNumber: true })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Department" errorId="product-department-error" error={errors.department_id?.message}>
                <select
                  className={inputClass}
                  disabled={!departments}
                  aria-invalid={!!errors.department_id}
                  aria-describedby={errors.department_id ? "product-department-error" : undefined}
                  {...register("department_id", { onChange: () => setValue("category_id", "") })}
                >
                  <option value="">{departments ? "Choose…" : "Loading…"}</option>
                  {departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Category" errorId="product-category-error" error={errors.category_id?.message}>
                {/* rendered once its options exist, so the saved category (edit) is selected straight away */}
                {categories ? (
                  <select
                    className={inputClass}
                    aria-invalid={!!errors.category_id}
                    aria-describedby={errors.category_id ? "product-category-error" : undefined}
                    {...register("category_id")}
                  >
                    <option value="">Choose…</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                ) : (
                  <select className={inputClass} disabled>
                    <option>{departmentId ? "Loading…" : "Choose a department first"}</option>
                  </select>
                )}
              </Field>
            </div>

            <Field label="Description (optional)" errorId="product-description-error" error={errors.description?.message}>
              <textarea
                rows={4}
                className={`${inputClass} resize-y`}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "product-description-error" : undefined}
                {...register("description")}
              />
            </Field>

            {serverError && (
              <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">{serverError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-11 rounded-[10px] border border-line px-5 text-sm font-semibold transition hover:border-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add product"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
