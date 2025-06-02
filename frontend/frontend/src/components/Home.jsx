import { Link } from "react-router-dom"
import bitebackImg from "@/assets/biteback-logo-full.png"

const Home = ({ user }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow flex items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <img
            src={bitebackImg}
            alt="BiteBack"
            className="h-120 w-120 mx-auto mb-6 object-contain"
          />
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to BiteBack
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Your one-stop solution for restaurant management.
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          )}
        </div>
      </main>
      <footer className="text-center text-sm text-gray-500 py-6">
        © {new Date().getFullYear()} BiteBack. All rights reserved.
      </footer>
    </div>
  )
}

export default Home
