import { Link, Outlet } from "react-router-dom"
import React, { useState } from "react"
import SearchBar from "./SearchBar"
import { Button } from "./ui/button"

const NavBar = ({ name, links }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <React.Fragment>
      <header className="w-full px-4 py-4 shadow-md bg-indigo-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-gray-800 hover:opacity-70 transition"
          >
            {name}
          </Link>
          <Button
            variant="ghost"
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            ☰
          </Button>

          <nav className="hidden md:flex space-x-4 items-center">
            {links.map(({ path, name, type }) =>
              type === "link" ? (
                <Link
                  key={path}
                  to={path}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {name}
                </Link>
              ) : type === "input" ? (
                <SearchBar key={path} name={name} path={path} />
              ) : null
            )}
          </nav>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-2 space-y-2">
            {links.map(({ path, name, type }) =>
              type === "link" ? (
                <Link
                  key={path}
                  to={path}
                  className="block text-gray-700 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {name}
                </Link>
              ) : type === "input" ? (
                <div key={path} className="px-2">
                  <SearchBar name={name} path={path} />
                </div>
              ) : null
            )}
          </div>
        )}
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        <Outlet />
      </main>
    </React.Fragment>
  )
}

export default NavBar
