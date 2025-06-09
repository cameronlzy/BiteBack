import { Search } from "lucide-react"
import { Input } from "./ui/input"
import SearchSubmit from "./common/SearchSubmit"

const SearchBar = ({ name, value, onChange, onSubmit, isSubmitting }) => {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center w-full max-w-none border rounded-sm px-2 py-1 space-x-2"
    >
      <Search className="w-4 h-4 text-gray-500 ml-1" />
      <Input
        type="text"
        placeholder={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-grow border-none focus:ring-0 focus:outline-none"
      />
      <SearchSubmit
        type="submit"
        size="sm"
        className="ml-1"
        condition={isSubmitting}
      />
    </form>
  )
}

export default SearchBar
