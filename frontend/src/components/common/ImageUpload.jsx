import { useRef, useState } from "react"
import { FormLabel } from "@/components/ui/form"
import { Input } from "../ui/input"
import { toast } from "react-toastify"

const MAX_FILE_SIZE_MB = 5
const ACCEPTED_TYPES = ["image/jpeg", "image/png"]

const ImageUpload = ({
  selectedFiles,
  setSelectedFiles,
  index = 0,
  message,
  firstRequired,
}) => {
  const inputId = `image-upload-${index}`
  const dropRef = useRef(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  const validateFiles = (files) => {
    return Array.from(files).filter((file) => {
      const isValidSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
      const isValidType = ACCEPTED_TYPES.includes(file.type)
      if (!isValidSize || !isValidType) {
        toast.error(`${file.name} is invalid. Use JPEG/PNG ≤ 5MB.`)
        return false
      }
      return true
    })
  }

  const dedupeFiles = (newFiles) => {
    const combined = [...selectedFiles, ...newFiles]
    const seen = new Set()
    const unique = []

    for (const file of combined) {
      const name = typeof file === "string" ? file : file.name
      if (!seen.has(name)) {
        seen.add(name)
        unique.push(file)
      }
    }

    return unique.slice(0, 5)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const valid = validateFiles(e.dataTransfer.files)
    setSelectedFiles(dedupeFiles(valid))
  }

  const handleFileChange = (e) => {
    const valid = validateFiles(e.target.files)
    setSelectedFiles(dedupeFiles(valid))
    e.target.value = null
  }

  const handleRemove = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== indexToRemove))
  }

  const handleDragStart = (index) => setDragIndex(index)

  const handleDragOverPreview = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const reordered = [...selectedFiles]
    const [dragged] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, dragged)
    setDragIndex(index)
    setSelectedFiles(reordered)
  }

  return (
    <div className="space-y-4 mb-4">
      <FormLabel>Upload Images (Max 5)</FormLabel>

      <div
        ref={dropRef}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleFileDrop}
        className={`border-2 border-dashed rounded-md p-6 transition-colors ${
          isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <div className="flex justify-start">
          <Input
            type="file"
            multiple
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="inline-block cursor-pointer px-4 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-black/80"
          >
            Choose Files
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {message || "Or drag and drop images here"}
        </p>
      </div>

      {firstRequired && selectedFiles.length === 0 && (
        <p className="text-sm text-red-500">
          At least one image is required for thumbnail
        </p>
      )}

      {selectedFiles.length > 0 && (
        <div>
          <p className="text-sm font-medium mt-3">Preview (Drag to Reorder)</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative w-20 h-20"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOverPreview(e, index)}
              >
                <img
                  src={file instanceof File ? URL.createObjectURL(file) : file}
                  alt={`preview ${index}`}
                  className="object-cover w-full h-full rounded border"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  onClick={() => handleRemove(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
