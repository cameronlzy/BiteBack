import { Link, Outlet } from "react-router-dom"
import { Input } from "./ui/input"
import SearchBar from "./SearchBar"

const NavBar = ({ name, links }) => {
  return (
    <div>
      <header className="w-full px-6 py-4 rounded-sm flex justify-between items-center shadow-md bg-indigo-100">
        <Link
          to="/"
          className="text-2xl font-bold text-gray-800 hover:opacity-70 transition"
        >
          {name}
        </Link>
        <nav className="space-x-4">
          {links.map(({ path, name, type }) =>
            type == "link" ? (
              <Link
                key={path}
                to={path}
                className="text-gray-600 hover:text-gray-900"
              >
                {name}
              </Link>
            ) : type == "input" ? (
              <SearchBar name={name} path={path} />
            ) : null
          )}
        </nav>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default NavBar
