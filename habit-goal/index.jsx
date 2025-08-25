export const refreshFrequency = false; // Only update on changes (or set interval like 1000 * 60 * 60 for hourly refresh)

export const command =
  "cat ~/Documents/GitHub/ubersicht-widgets/habit-goal/data.json";

export const className = `
  position: absolute;
  top: 50%;
  right: 50px;
  transform: translateY(-50%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: white;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  max-width: 380px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);

  .section {
    margin-bottom: 30px;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .item {
    margin-bottom: 18px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
  }

  .item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  .item:last-child {
    margin-bottom: 0;
  }

  .goal-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    color: rgba(255, 255, 255, 0.95);
  }

  .habit-title {
    font-weight: 500;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
  }

  .habit-streak {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    min-width: 40px;
    text-align: right;
  }

  .error {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.2);
    padding: 16px;
    border-radius: 12px;
    font-weight: 500;
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
        Math.max(0, Math.floor(((now - start) / (end - start)) * 100))
      );
      return (
        <div className="item" key={`goal-${i}`}>
          <div className="goal-title">{goal.title}</div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        </div>
      );
    });

    const habits = data.habits.map((habit, i) => {
      const start = new Date(habit.start);
      const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      return (
        <div className="item" key={`habit-${i}`}>
          <div className="habit-title">{habit.title}</div>
          <div className="habit-streak">{days} {days === 1 ? 'day' : 'days'} streak</div>
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
    return <div className="error">Error loading data: {err.message}</div>;
  }
};
