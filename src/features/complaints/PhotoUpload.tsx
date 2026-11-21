import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1280;

type PhotoUploadProps = {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  error?: string;
};

/** Compress in the browser so the demo photo fits in localStorage. */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is not available in this browser.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image could not be read."));
    };
    image.src = objectUrl;
  });
}

export function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const shownError = localError || error;

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    setLocalError("");

    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file (JPG, PNG, HEIC or WebP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("That photo is larger than 5 MB. Please choose a smaller one.");
      return;
    }

    setProcessing(true);
    try {
      onChange(await toDataUrl(file));
    } catch {
      setLocalError("We could not process that photo. Please try another one.");
    } finally {
      setProcessing(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    void acceptFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  }

  function removePhoto() {
    setLocalError("");
    onChange(undefined);
  }

  if (value) {
    return (
      <div className="photo-preview">
        <img src={value} alt="Preview of the attached complaint photo" />
        <div className="photo-preview__bar">
          <span>Photo attached</span>
          <button type="button" className="link-button link-button--danger" onClick={removePhoto}>
            Remove photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`dropzone${dragging ? " dropzone--active" : ""}${shownError ? " dropzone--error" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="dropzone__icon" aria-hidden="true">
          ＋
        </span>
        <p className="dropzone__title">{processing ? "Adding photo…" : "Add a photo if you have one"}</p>
        <p className="dropzone__hint">Drag and drop an image here, or</p>
        <label className="btn btn--secondary btn--sm dropzone__button" htmlFor="complaint-photo">
          Choose a photo
        </label>
        <input
          ref={inputRef}
          id="complaint-photo"
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={processing}
          aria-describedby={shownError ? "complaint-photo-error" : undefined}
          aria-invalid={shownError ? true : undefined}
        />
        <p className="dropzone__hint dropzone__hint--small">JPG, PNG or WebP · up to 5 MB · optional</p>
      </div>
      {shownError && (
        <p className="field__error" id="complaint-photo-error" role="alert">
          <span aria-hidden="true">⚠</span> {shownError}
        </p>
      )}
    </div>
  );
}
