export const refreshFrequency = false; // Only update on changes (or set interval like 1000 * 60 * 60 for hourly refresh)

export const command =
  "cat ~/Documents/Github/ubersicht-widgets/habit-goal-widget/data.json";

export const className = `

  font-family: -apple-system, sans-serif;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 10px;
  max-width: 320px;

  .section {
    margin-bottom: 20px;
  }

  .item {
    margin-bottom: 10px;
  }

  progress {
    width: 100%;
    height: 8px;
    border-radius: 4px;
  }
`;

export const render = ({ output }) => {
  try {
    const data = JSON.parse(output);
    const now = new Date();

    const goals = data.goals.map((goal, i) => {
      const start = new Date(goal.start);
      const end = new Date(goal.end);
      const progress = Math.min(
        100,
        Math.floor(((now - start) / (end - start)) * 100)
      );
      return (
        <div className="item" key={`goal-${i}`}>
          <b>{goal.title}</b>
          <br />
          <progress max="100" value={progress}></progress> {progress}%
        </div>
      );
    });

    const habits = data.habits.map((habit, i) => {
      const start = new Date(habit.start);
      const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return (
        <div className="item" key={`habit-${i}`}>
          {habit.title} — {days} days
        </div>
      );
    });

    return (
      <div>
        <div className="section">
          <h2>🎯 Goals</h2>
          {goals}
        </div>
        <div className="section">
          <h2>🔁 Habits</h2>
          {habits}
        </div>
      </div>
    );
  } catch (err) {
    return <div style={{ color: "red" }}>Error: {err.message}</div>;
  }
};
