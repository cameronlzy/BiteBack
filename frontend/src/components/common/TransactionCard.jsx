import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { DateTime } from "luxon"
import DisabledBlur from "@/components/common/DisabledBlur"
import { readableTimeSettings } from "@/utils/timeConverter"

const TransactionCard = ({
  _id,
  name,
  price,
  currencyType,
  iconComponent,
  image,
  date,
  description,
  disabled = false,
  disabledMessage = "",
  rewardCode,
  contentMessage,
  withinStartMessage,
  timeDuration,
  startTime,
  clickMessage,
  expiry,
  onClick,
}) => {
  const [showContentMessage, setShowContentMessage] = useState(true)
  const [remainingTime, setRemainingTime] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!startTime || !timeDuration) return

    const updateTimer = () => {
      const now = DateTime.now().setZone("Asia/Singapore")
      const diff = expiry.diff(now, ["minutes", "seconds"]).toObject()

      if (now >= expiry) {
        setShowContentMessage(false)
        setRemainingTime(null)
        setIsExpired(true)
      } else {
        setRemainingTime(
          `${Math.floor(diff.minutes || 0)
            .toString()
            .padStart(2, "0")}:${Math.floor(diff.seconds || 0)
            .toString()
            .padStart(2, "0")}`
        )
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [startTime, timeDuration])

  return (
    <Card
      key={_id}
      className={`mb-4 shadow ${
        isExpired && rewardCode ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {currencyType === "points" && iconComponent ? (
        <DisabledBlur
          component={iconComponent}
          disabled={disabled}
          disabledMessage={disabledMessage}
          isImage={false}
        />
      ) : image ? (
        <div className="px-4 pt-4">
          <DisabledBlur
            component={image}
            disabled={disabled}
            disabledMessage={disabledMessage}
            isImage={true}
          />
        </div>
      ) : null}

      <CardHeader>
        <CardTitle className="flex justify-between items-center text-xl font-bold">
          <span className="truncate">{name}</span>
          <span className="text-sm text-muted-foreground">
            {price != null
              ? currencyType === "points"
                ? `${price} pts`
                : `$${price}`
              : ""}
          </span>
        </CardTitle>

        {!isExpired && rewardCode ? (
          <p className="text-md mt-1">
            Reward Code: <strong>{rewardCode}</strong>
          </p>
        ) : description ? (
          <p className="text-base font-medium mt-1">{description}</p>
        ) : null}

        {date && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {typeof date === "string" || date instanceof Date
              ? DateTime.fromISO(
                  typeof date === "string" ? date : date.toISOString()
                )
                  .setZone("Asia/Singapore")
                  .toLocaleString(readableTimeSettings)
              : ""}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {showContentMessage && contentMessage && (
          <p className="text-sm text-blue-600 mb-2">{contentMessage}</p>
        )}
        {remainingTime && withinStartMessage && (
          <p className="text-xs text-muted-foreground mb-2">
            {withinStartMessage} –{" "}
            <span className="font-medium">{remainingTime}</span>
          </p>
        )}
        {clickMessage && onClick ? (
          <Button variant="ghost" onClick={onClick} className="w-full">
            {clickMessage}
          </Button>
        ) : (
          <div className="h-10 w-full rounded-md border border-transparent" />
        )}
      </CardContent>
    </Card>
  )
}

export default TransactionCard
