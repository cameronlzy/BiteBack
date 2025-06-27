import ReservationBarGraph from "../ReservationBarGraph"
import StatisticsCard from "./StatisticsCard"
import ReservationTrends from "./ReservationTrends"
import ReviewTrends from "./ReviewTrends"
import QueueTrends from "./QueueTrends"

const MonthlyPerformance = () => {
  const dummy30DayData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split("T")[0],
      reservations: Math.floor(50 + Math.random() * 50),
    }
  })

  const statisticsCardDummyData = {
    restaurant: {
      _id: "testing",
      name: "YoYo's Kitchen",
    },

    today: {
      averageWaitTime: 35,
      reservationCount: 5,
      queueBreakdown: [
        { label: "1-2 Pax", value: 20 },
        { label: "3-4 Pax", value: 14 },
        { label: "5+ Pax", value: 8 },
      ],
    },
  }
  const generateDummyReviewStats = () => {
    const data = []
    const today = new Date()
    const mode = Math.floor(Math.random() * 5) + 1

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - (29 - i))

      const attendance = Math.floor(Math.random() * 41) + 10
      const count = Math.floor(Math.random() * (attendance + 1))

      data.push({
        date: date.toISOString().split("T")[0],
        count,
        attendanceCount: attendance,
        averageRating: parseFloat((Math.random() * 4 + 1).toFixed(2)),
        ratingMode: mode,
      })
    }

    return data
  }

  const reviewData = generateDummyReviewStats()

  const trendData = {
    reservationOverTime: dummy30DayData,
    reservationByGroupSize: [
      {
        label: "January",
        data: {
          totalReservations: 120,
          reservationsAttended: 100,
          averagePax: 4.24,
        },
      },
      {
        label: "February",
        data: {
          totalReservations: 140,
          reservationsAttended: 100,
          averagePax: 4.43,
        },
      },
      {
        label: "March",
        data: {
          totalReservations: 140,
          reservationsAttended: 100,
          averagePax: 4.43,
        },
      },
      {
        label: "April",
        data: {
          totalReservations: 140,
          reservationsAttended: 110,
          averagePax: 4.43,
        },
      },
      {
        label: "May",
        data: {
          totalReservations: 140,
          reservationsAttended: 110,
          averagePax: 4.43,
        },
      },
      {
        label: "June",
        data: {
          totalReservations: 140,
          reservationsAttended: 110,
          averagePax: 4.12,
        },
      },
    ],
  }
  return (
    <div className="w-full overflow-x-auto mt-6">
      <StatisticsCard
        today={statisticsCardDummyData.today}
        restaurant={statisticsCardDummyData.restaurant}
      />
      <h1 className="mt-6 text-2xl font-bold">
        Monthly Restaurant Performance
      </h1>
      <ReservationTrends data={trendData} />
      <ReviewTrends data={reviewData} />
      <QueueTrends />
    </div>
  )
}

export default MonthlyPerformance
