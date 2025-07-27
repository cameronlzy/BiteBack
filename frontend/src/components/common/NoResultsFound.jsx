const NoResultsFound = ({ text, padding }) => {
  return (
    <div className={`text-center ${padding || ""} text-gray-500 italic`}>
      {text}
    </div>
  )
}

export default NoResultsFound
