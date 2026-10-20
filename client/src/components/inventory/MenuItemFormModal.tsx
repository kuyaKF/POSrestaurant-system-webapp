import { useEffect, useState } from "react";
import { Category, MenuItem } from "../../types";
import { MenuItemInput } from "../../api/menu";
import { Modal } from "../common/Modal";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface MenuItemFormSubmission {
  input: MenuItemInput;
  imageFile: File | null;
  removeImage: boolean;
}

export function MenuItemFormModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (submission: MenuItemFormSubmission) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price / 100) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? 0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.imageUrl ?? null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Revoke the previous blob preview whenever it's replaced or the modal
  // unmounts, so picking a few images in a row doesn't leak memory.
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const priceNumber = Number(price);
  const canSave = name.trim().length > 0 && price !== "" && priceNumber >= 0 && categoryId > 0;
  const removedExistingImage = !!item?.imageUrl && !imageFile && previewUrl === null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please choose a JPEG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      return;
    }
    setImageError(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setPreviewUrl(null);
    setImageError(null);
  }

  return (
    <Modal title={item ? "Edit Menu Item" : "Add Menu Item"} onClose={onClose}>
      <div className="form-row">
        <label>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <label>Price (₱)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label>Category</label>
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Image</label>
        <div className="image-upload">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="image-upload-preview" />
          ) : (
            <div className="image-upload-placeholder">No image</div>
          )}
          <div className="image-upload-actions">
            <label className="btn btn-sm image-upload-btn">
              {previewUrl ? "Change" : "Upload"}
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleFileChange}
                hidden
              />
            </label>
            {previewUrl && (
              <button type="button" className="btn btn-sm btn-danger" onClick={handleRemoveImage}>
                Remove
              </button>
            )}
          </div>
        </div>
        {imageError && <p className="image-upload-error">{imageError}</p>}
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSave}
          onClick={() =>
            onSave({
              input: { name: name.trim(), price: Math.round(priceNumber * 100), categoryId },
              imageFile,
              removeImage: removedExistingImage,
            })
          }
        >
          {item ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </Modal>
  );
}
