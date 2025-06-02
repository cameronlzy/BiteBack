const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

const LoadingSpinner = ({ size = "md", inline = false }) => {
  const spinnerSize = sizeClasses[size] || sizeClasses["md"]

  return inline ? (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${spinnerSize}`}
    />
  ) : (
    <div className="flex justify-center py-10">
      <div
        className={`animate-spin rounded-full border-4 border-gray-300 border-t-primary ${spinnerSize}`}
      />
    </div>
  )
}

export default LoadingSpinner
