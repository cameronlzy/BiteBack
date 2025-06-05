import { Button } from "@/components/ui/button"

const BadgeReactions = ({
  badges,
  badgeCounts,
  selectedBadgeIndex,
  onReact,
}) => {
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {badges.map((badge, index) => (
        <Button
          key={badge.name}
          variant="outline"
          size="icon"
          onClick={() => onReact(index)}
          className={`relative w-10 h-10 p-0 rounded-full ${
            selectedBadgeIndex === index ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <img
            src={badge.image}
            alt={badge.name}
            className="w-full h-full object-cover"
          />
          <span
            className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 
                       bg-black text-white text-[10px] leading-none 
                       rounded-full px-1.5 py-0.5 z-10"
          >
            {badgeCounts?.[index] ?? 0}
          </span>
        </Button>
      ))}
    </div>
  )
}

export default BadgeReactions
