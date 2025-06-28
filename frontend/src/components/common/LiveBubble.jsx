const LiveBubble = ({ bgColour, isOpen, textColour }) => {
  return (
    <div className="absolute top-3 right-3 flex items-center space-x-1">
      <span className="relative flex h-2 w-2">
        <span
          className={`${
            isOpen && "animate-ping"
          } absolute inline-flex h-full w-full rounded-full ${bgColour} opacity-75`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2${bgColour}`}
        />
      </span>
      <span
        className={`text-xs font-medium ${textColour} px-2 py-0.5 rounded-full`}
      >
        {isOpen ? "Open" : "Closed"}
      </span>
    </div>
  )
}

export default LiveBubble
