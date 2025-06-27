import { DateTime } from 'luxon';

export function groupVisitLoadByWeekdayPattern(docs) {
    const groups = {}; // key: `${weekday}-${startHour}-${length}`

    for (const doc of docs) {
        if (!doc.visitLoadByHour || !doc.visitLoadByHour.load) continue;

        const date = DateTime.fromJSDate(doc.date).setZone('Asia/Singapore');
        const weekday = date.weekday - 1;

        const { startHour, load } = doc.visitLoadByHour;
        const key = `${weekday}-${startHour}-${load.length}`;

        if (!groups[key]) {
            groups[key] = {
                weekday,
                startHour,
                slots: load.length,
                sum: new Array(load.length).fill(0),
                count: 0
            };
        }

        for (let i = 0; i < load.length; i++) {
            groups[key].sum[i] += load[i];
        }
        groups[key].count += 1;
    }

    return Object.values(groups).map(group => ({
        weekday: group.weekday,
        startHour: group.startHour,
        slots: group.slots,
        averageLoad: group.sum.map(x => x / group.count)
    }));
}

export function computeMode(numbers) {
    const freq = new Map();
    let mode = null;
    let max = 0;

    for (const num of numbers) {
        if (num == null) continue;
        const count = (freq.get(num) || 0) + 1;
        freq.set(num, count);
        if (count > max) {
            mode = num;
            max = count;
        }
    }

    return mode;
}

export function getPeriodFromLabel(label, unit) {
  let start, end;
  if (unit === 'day') {
    start = DateTime.fromFormat(label, 'yyyy-MM-dd', { zone: 'Asia/Singapore' }).startOf('day');
    end = start;
  } else if (unit === 'week') {
    start = DateTime.fromFormat(label, 'kkkk-\'W\'WW', { zone: 'Asia/Singapore' }).startOf('week');
    end = start.endOf('week');
  } else if (unit === 'month') {
    start = DateTime.fromFormat(label, 'yyyy-MM', { zone: 'Asia/Singapore' }).startOf('month');
    end = start.endOf('month');
  }
  return {
    startDate: start.toISODate(),
    endDate: end.toISODate()
  };
}
