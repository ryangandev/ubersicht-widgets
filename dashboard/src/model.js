import { PRESET_NAMES } from "./presets.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value) => String(value).padStart(2, "0");

const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateKey = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid local date: ${value}`);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const differenceInDays = (left, right) => {
  const leftDate = fromDateKey(toDateKey(left));
  const rightDate = fromDateKey(toDateKey(right));
  return Math.round((leftDate - rightDate) / MS_PER_DAY);
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const startOfWeek = (date) => {
  const normalized = fromDateKey(toDateKey(date));
  const day = normalized.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  return addDays(normalized, delta);
};

const formatShortDate = (date) =>
  `${WEEKDAYS[date.getDay()]} ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const sortByDateAsc = (left, right) => left.localeCompare(right);

const validateCollection = (collection, label) => {
  if (!Array.isArray(collection)) {
    throw new Error(`${label} must be an array`);
  }
};

export const validateDashboardData = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Dashboard data must export an object");
  }

  if (!Number.isInteger(data.version) || data.version < 1) {
    throw new Error("Dashboard data version must be a positive integer");
  }

  if (!data.dashboard || typeof data.dashboard !== "object") {
    throw new Error("dashboard metadata is required");
  }

  if (!PRESET_NAMES.includes(data.dashboard.preset)) {
    throw new Error(
      `dashboard preset must be one of: ${PRESET_NAMES.join(", ")}`
    );
  }

  validateCollection(data.goals, "goals");
  validateCollection(data.habits, "habits");
  validateCollection(data.countdowns, "countdowns");

  data.goals.forEach((goal) => {
    if (!goal.id || !goal.title || !goal.startDate || !goal.targetDate) {
      throw new Error("Each goal requires id, title, startDate, and targetDate");
    }

    const startDate = fromDateKey(goal.startDate);
    const targetDate = fromDateKey(goal.targetDate);

    if (targetDate < startDate) {
      throw new Error(`Goal ${goal.id} targetDate cannot precede startDate`);
    }

    if (goal.completedAt) {
      fromDateKey(goal.completedAt);
    }
  });

  data.habits.forEach((habit) => {
    if (!habit.id || !habit.title || !habit.cadence || !habit.targetCount) {
      throw new Error("Each habit requires id, title, cadence, and targetCount");
    }

    if (!["daily", "weekly"].includes(habit.cadence)) {
      throw new Error(`Habit ${habit.id} cadence must be daily or weekly`);
    }

    if (!Number.isInteger(habit.targetCount) || habit.targetCount < 1) {
      throw new Error(`Habit ${habit.id} targetCount must be a positive integer`);
    }

    if (habit.cadence === "daily" && habit.targetCount !== 1) {
      throw new Error(`Habit ${habit.id} daily targetCount must equal 1`);
    }

    if (!Array.isArray(habit.checkIns)) {
      throw new Error(`Habit ${habit.id} checkIns must be an array of dates`);
    }

    habit.checkIns.forEach(fromDateKey);
  });

  data.countdowns.forEach((countdown) => {
    if (!countdown.id || !countdown.title || !countdown.targetDate) {
      throw new Error("Each countdown requires id, title, and targetDate");
    }

    fromDateKey(countdown.targetDate);

    if (countdown.completedAt) {
      fromDateKey(countdown.completedAt);
    }
  });
};

const getGoalStatus = (goal, now) => {
  if (goal.completedAt) {
    return "completed";
  }

  const startDate = fromDateKey(goal.startDate);
  const targetDate = fromDateKey(goal.targetDate);

  if (differenceInDays(now, startDate) < 0) {
    return "upcoming";
  }

  if (differenceInDays(now, targetDate) > 0) {
    return "overdue";
  }

  return "active";
};

const deriveGoal = (goal, now) => {
  const startDate = fromDateKey(goal.startDate);
  const targetDate = fromDateKey(goal.targetDate);
  const status = getGoalStatus(goal, now);
  const elapsedDays = differenceInDays(now, startDate);
  const totalDays = Math.max(1, differenceInDays(targetDate, startDate));
  const progressPercent =
    status === "completed"
      ? 100
      : Math.round(clamp((elapsedDays / totalDays) * 100, 0, 100));

  const daysUntilTarget = differenceInDays(targetDate, now);

  let timelineLabel = `Runs ${formatShortDate(startDate)} to ${formatShortDate(
    targetDate
  )}`;
  let statusLabel = status;

  if (status === "upcoming") {
    timelineLabel = `Starts in ${pluralize(
      Math.abs(elapsedDays),
      "day"
    )} and lands ${formatShortDate(targetDate)}`;
    statusLabel = "Upcoming";
  } else if (status === "active") {
    timelineLabel = `${pluralize(daysUntilTarget, "day")} remaining`;
    statusLabel = "Active";
  } else if (status === "overdue") {
    timelineLabel = `${pluralize(Math.abs(daysUntilTarget), "day")} late`;
    statusLabel = "Overdue";
  } else if (status === "completed") {
    const completedAt = fromDateKey(goal.completedAt);
    timelineLabel = `Completed ${formatShortDate(completedAt)}`;
    statusLabel = "Completed";
  }

  return {
    ...goal,
    progressPercent,
    status,
    statusLabel,
    timelineLabel,
    track: goal.track || "General",
  };
};

const getPeriodKeyForDate = (date, cadence) =>
  cadence === "daily" ? toDateKey(date) : toDateKey(startOfWeek(date));

const getPreviousPeriodKey = (periodKey, cadence) => {
  const date = fromDateKey(periodKey);
  return cadence === "daily"
    ? toDateKey(addDays(date, -1))
    : toDateKey(addDays(date, -7));
};

const buildCheckInCounts = (checkIns, cadence) => {
  const counts = new Map();

  checkIns.forEach((checkIn) => {
    const periodKey =
      cadence === "daily"
        ? checkIn
        : toDateKey(startOfWeek(fromDateKey(checkIn)));

    counts.set(periodKey, (counts.get(periodKey) || 0) + 1);
  });

  return counts;
};

const deriveHabit = (habit, now) => {
  const sortedCheckIns = [...habit.checkIns].sort(sortByDateAsc);
  const counts = buildCheckInCounts(sortedCheckIns, habit.cadence);
  const currentPeriodKey = getPeriodKeyForDate(now, habit.cadence);
  const previousPeriodKey = getPreviousPeriodKey(currentPeriodKey, habit.cadence);
  const currentCount = counts.get(currentPeriodKey) || 0;

  const isCurrentPeriodComplete = currentCount >= habit.targetCount;
  let anchorPeriodKey = null;

  if (isCurrentPeriodComplete) {
    anchorPeriodKey = currentPeriodKey;
  } else if (counts.get(previousPeriodKey) >= habit.targetCount) {
    anchorPeriodKey = previousPeriodKey;
  }

  let streak = 0;
  let cursor = anchorPeriodKey;

  while (cursor && (counts.get(cursor) || 0) >= habit.targetCount) {
    streak += 1;
    cursor = getPreviousPeriodKey(cursor, habit.cadence);
  }

  const lastCheckIn = sortedCheckIns.length
    ? fromDateKey(sortedCheckIns[sortedCheckIns.length - 1])
    : null;
  const status = isCurrentPeriodComplete
    ? "on-track"
    : streak > 0
      ? "active"
      : "needs-check-in";

  const cadenceLabel =
    habit.cadence === "daily"
      ? "Daily"
      : `${habit.targetCount}x / week`;

  const periodProgressLabel =
    habit.cadence === "daily"
      ? currentCount > 0
        ? "Done today"
        : "Not checked in"
      : `${currentCount}/${habit.targetCount} this week`;

  return {
    ...habit,
    streak,
    cadenceLabel,
    periodProgressLabel,
    checkInLabel:
      habit.cadence === "daily"
        ? "Tracks one real check-in per day."
        : "Tracks real check-ins against a weekly target.",
    lastCheckInLabel: lastCheckIn
      ? `Last ${formatShortDate(lastCheckIn)}`
      : "No check-ins",
    streakLabel:
      streak > 0
        ? habit.cadence === "daily"
          ? pluralize(streak, "day")
          : pluralize(streak, "week")
        : "No streak",
    status,
    statusLabel:
      status === "on-track"
        ? "On track"
        : status === "active"
          ? "In play"
          : "Needs check-in",
  };
};

const deriveCountdown = (countdown, now) => {
  const targetDate = fromDateKey(countdown.targetDate);
  const effectiveCompletedAt =
    countdown.completedAt ||
    (differenceInDays(now, targetDate) > 0 ? countdown.targetDate : null);
  const status = effectiveCompletedAt ? "completed" : "active";
  const daysUntil = differenceInDays(targetDate, now);

  let valueLabel = `${Math.max(daysUntil, 0)}d`;
  let supportingLabel = `${pluralize(daysUntil, "day")} remaining`;
  let statusLabel = "Active";

  if (daysUntil === 0 && !effectiveCompletedAt) {
    valueLabel = "Today";
    supportingLabel = "Due today";
  }

  if (effectiveCompletedAt) {
    const completedDate = fromDateKey(effectiveCompletedAt);
    valueLabel = "Done";
    supportingLabel = `Closed ${formatShortDate(completedDate)}`;
    statusLabel = "Completed";
  }

  return {
    ...countdown,
    status,
    statusLabel,
    category: countdown.category || "Milestone",
    dateLabel: formatShortDate(targetDate),
    valueLabel,
    supportingLabel,
    sortDate: effectiveCompletedAt || countdown.targetDate,
  };
};

const compareGoals = (left, right) => {
  const order = { overdue: 0, active: 1, upcoming: 2, completed: 3 };
  return order[left.status] - order[right.status] || left.targetDate.localeCompare(right.targetDate);
};

const compareHabit = (left, right) =>
  right.streak - left.streak || left.title.localeCompare(right.title);

const compareCountdownActive = (left, right) =>
  left.targetDate.localeCompare(right.targetDate);

const compareCountdownCompleted = (left, right) =>
  right.sortDate.localeCompare(left.sortDate);

export const buildDashboardSnapshot = (data, now = new Date()) => {
  validateDashboardData(data);

  const goals = data.goals.map((goal) => deriveGoal(goal, now)).sort(compareGoals);
  const habits = data.habits.map((habit) => deriveHabit(habit, now)).sort(compareHabit);
  const countdowns = data.countdowns
    .map((countdown) => deriveCountdown(countdown, now));

  const activeCountdowns = countdowns
    .filter((countdown) => countdown.status === "active")
    .sort(compareCountdownActive);
  const completedCountdowns = countdowns
    .filter((countdown) => countdown.status === "completed")
    .sort(compareCountdownCompleted);

  const activeGoals = goals.filter((goal) => goal.status !== "completed");
  const completedGoals = goals.filter((goal) => goal.status === "completed");
  const habitsOnStreak = habits.filter((habit) => habit.streak > 0).length;
  const longestHabitStreak =
    habits.length > 0 ? `${Math.max(...habits.map((habit) => habit.streak))}` : "0";

  const nextCountdown = activeCountdowns[0];
  const activeGoal = activeGoals.find((goal) => goal.status === "active");

  return {
    dashboard: data.dashboard,
    generatedAtLabel: `Updated ${formatShortDate(now)}`,
    goals: {
      active: activeGoals,
      completed: completedGoals,
    },
    habits,
    countdowns: {
      active: activeCountdowns,
      completed: completedCountdowns,
    },
    summary: {
      activeGoals: activeGoals.length,
      goalCopy: activeGoal
        ? `${activeGoal.title} is the lead push.`
        : "No active goals are currently in motion.",
      habitsOnStreak,
      habitCopy:
        habitsOnStreak > 0
          ? `${pluralize(habitsOnStreak, "habit")} still has a live streak.`
          : "No habits are currently on streak.",
      activeCountdowns: activeCountdowns.length,
      countdownCopy: nextCountdown
        ? `${nextCountdown.title} is next.`
        : "No future countdowns are configured.",
      longestHabitStreak,
      nextCountdownLabel: nextCountdown ? nextCountdown.title : "nothing queued",
    },
  };
};
