import React from "react"

const DisabledBlur = ({
  component,
  disabled,
  disabledMessage,
  isImage = false,
}) => {
  return (
    <div className="relative">
      {isImage ? (
        <img
          src={component}
          alt="disabled-preview"
          className="w-full h-auto object-cover rounded-lg border border-gray-200 shadow-sm"
        />
      ) : (
        <div
          className={`flex justify-center items-center bg-gray-50 py-6 rounded-t-xl ${
            disabled ? "opacity-40" : ""
          }`}
        >
          {component}
        </div>
      )}

      {disabled && disabledMessage && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-m flex items-center justify-center text-gray-700 font-semibold text-lg rounded-lg px-4 text-center">
          {disabledMessage}
        </div>
      )}
    </div>
  )
}

export default DisabledBlur
