const dashboardData = {
  version: 1,
  dashboard: {
    title: "Momentum Board",
    subtitle:
      "A single click-through desktop surface for goals, habit streaks, and live milestones.",
    preset: "balanced",
  },
  goals: [
    {
      id: "build-java-backend",
      title: "Build Java backend",
      track: "Career",
      startDate: "2026-08-01",
      targetDate: "2026-09-15",
    },
    {
      id: "portable-dashboard-rollout",
      title: "Portable dashboard rollout",
      track: "System",
      startDate: "2026-08-10",
      targetDate: "2026-08-31",
    },
    {
      id: "ms-application-package",
      title: "MS application package",
      track: "Education",
      startDate: "2026-06-01",
      targetDate: "2026-08-01",
      completedAt: "2026-07-29",
    },
  ],
  habits: [
    {
      id: "gym",
      title: "Gym",
      cadence: "weekly",
      targetCount: 3,
      checkIns: [
        "2026-08-03",
        "2026-08-05",
        "2026-08-07",
        "2026-08-10",
        "2026-08-12",
        "2026-08-14",
        "2026-08-17",
        "2026-08-18",
      ],
    },
    {
      id: "deep-work-block",
      title: "Deep work block",
      cadence: "daily",
      targetCount: 1,
      checkIns: [
        "2026-08-15",
        "2026-08-16",
        "2026-08-17",
        "2026-08-18",
        "2026-08-19",
      ],
    },
    {
      id: "mobility-reset",
      title: "Mobility reset",
      cadence: "daily",
      targetCount: 1,
      checkIns: ["2026-08-13", "2026-08-15", "2026-08-17"],
    },
  ],
  countdowns: [
    {
      id: "next-dexa-scan",
      title: "Next Dexa scan",
      category: "Health",
      targetDate: "2026-09-24",
    },
    {
      id: "first-philly-visit",
      title: "First Philly visit",
      category: "Travel",
      targetDate: "2026-10-12",
    },
    {
      id: "walmart-contract-ends",
      title: "Walmart contract ends",
      category: "Work",
      targetDate: "2026-12-31",
    },
    {
      id: "ms-application-submitted",
      title: "MS application submitted",
      category: "Education",
      targetDate: "2026-08-01",
    },
    {
      id: "summer-planning-cutoff",
      title: "Summer planning cutoff",
      category: "Planning",
      targetDate: "2026-07-15",
      completedAt: "2026-07-10",
    },
  ],
};

export default dashboardData;
