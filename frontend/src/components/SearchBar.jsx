import { Search } from "lucide-react"
import { Input } from "./ui/input"

const SearchBar = ({ name, onChange }) => {
  return (
    <div key={name} className="flex items-center border rounded-sm px-2 py-1">
      <Search className="w-4 h-4 ml-1 mr-2 text-gray-500" />
      <Input
        key={name}
        type="text"
        placeholder={name}
        className="border border-gray-300 rounded-sm px-2 py-1"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default SearchBar
