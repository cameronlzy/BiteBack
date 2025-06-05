import { FormLabel } from "@/components/ui/form"
import { Input } from "../ui/input"
import { toast } from "react-toastify"

const ImageUpload = ({
  selectedFiles,
  setSelectedFiles,
  index,
  message,
  firstRequired,
}) => {
  const inputId = `image-upload-${index}`
  const MAX_FILE_SIZE_MB = 5

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files)

    const filtered = newFiles.filter((file) => {
      const isValidSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
      const isValidType = ["image/jpeg", "image/png"].includes(file.type)
      if (!isValidSize || !isValidType) {
        toast.error(
          `${file.name} is invalid. Ensure it's JPEG/PNG and ≤ 5MB in size.`
        )
        return false
      }
      return true
    })

    const deduped = (() => {
      const combined = [...selectedFiles, ...filtered]
      return Array.from(new Set(combined.map((f) => f.name)))
        .map((name) => combined.find((f) => f.name === name))
        .slice(0, 5)
    })()

    setSelectedFiles(deduped)
    e.target.value = null
  }

  const handleRemove = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, i) => i !== indexToRemove)
    setSelectedFiles(newFiles)
  }

  return (
    <div className="space-y-4 mb-4">
      <FormLabel>Upload Images (Max 5)</FormLabel>
      <div className="flex justify-start">
        <Input
          type="file"
          multiple
          accept="image/png, image/jpeg"
          onChange={handleChange}
          className="hidden"
          id={inputId}
        />
        {/* Work Around for displaying file names since cannot change input */}
        <label
          htmlFor={inputId}
          className="inline-block cursor-pointer px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-black/80"
        >
          Choose Files
        </label>
      </div>
      {firstRequired && selectedFiles.length === 0 && (
        <p className="text-sm text-red-500">
          At least one image is required for thumbnail
        </p>
      )}
      <p className="text-sm text-gray-500">{message}</p>
      {Array.isArray(selectedFiles) && selectedFiles.length > 0 && (
        <ul className="text-gray-600 text-sm mt-2 space-y-1">
          {Array.isArray(selectedFiles) &&
            selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
        </ul>
      )}
      {Array.isArray(selectedFiles) && selectedFiles.length > 0 && (
        <div>
          <h1>Check Images Uploaded</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            {selectedFiles.map((file, index) =>
              file instanceof File ? (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview ${index}`}
                    className="object-cover w-full h-full rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => handleRemove(index)}
                  >
                    ×
                  </button>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
