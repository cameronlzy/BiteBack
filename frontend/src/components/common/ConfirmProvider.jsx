import { createContext, useState, useContext } from "react"

const ConfirmContext = createContext()

export const ConfirmProvider = ({ children }) => {
  const [message, setMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [resolve, setResolve] = useState(null)

  const confirm = (msg) => {
    setMessage(msg)
    setIsOpen(true)
    return new Promise((res) => setResolve(() => res))
  }

  const handleConfirm = () => {
    setIsOpen(false)
    resolve(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolve(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow space-y-4 max-w-sm w-full">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end space-x-2">
              <button onClick={handleCancel} className="px-3 py-1 border">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1 bg-red-600 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
