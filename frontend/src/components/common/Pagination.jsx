import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "../ui/button"

const Pagination = ({ currentPage, totalPages, totalCount, onPageChange }) => {
  return (
    <div className="flex flex-col items-center mt-6 space-y-2 w-full">
      <div className="flex items-center justify-center space-x-4 w-full max-w-sm">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm font-medium min-w-[120px] text-center">
          Page {currentPage} of {totalPages <= 1 ? 1 : totalPages}
        </span>

        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center w-full max-w-sm">
        {totalCount || 0} result{totalCount !== 1 ? "s" : ""} found
      </p>
    </div>
  )
}

export default Pagination
