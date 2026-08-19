import dashboardData from "../dashboard/src/dashboard-data.js";
import { buildDashboardSnapshot } from "../dashboard/src/model.js";

const nowArg = process.argv[2];
const now = nowArg ? new Date(nowArg) : new Date();

if (Number.isNaN(now.getTime())) {
  console.error(`Invalid date argument: ${nowArg}`);
  process.exit(1);
}

try {
  const snapshot = buildDashboardSnapshot(dashboardData, now);

  console.log(
    JSON.stringify(
      {
        generatedAt: snapshot.generatedAtLabel,
        preset: snapshot.dashboard.preset,
        goals: {
          active: snapshot.goals.active.length,
          completed: snapshot.goals.completed.length,
        },
        habits: snapshot.habits.map((habit) => ({
          id: habit.id,
          status: habit.status,
          streak: habit.streak,
          progress: habit.periodProgressLabel,
        })),
        countdowns: {
          active: snapshot.countdowns.active.length,
          completed: snapshot.countdowns.completed.length,
          next: snapshot.summary.nextCountdownLabel,
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(`Dashboard validation failed: ${error.message}`);
  process.exit(1);
}
