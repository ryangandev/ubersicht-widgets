export const command =
  "cat ~/Documents/GitHub/ubersicht-widgets/countdown-timer/data.json";

export const refreshFrequency = 360000; // Refresh every hour

export const render = ({ output }) => {
  if (!output) return <div>Loading...</div>;

  let data;
  try {
    data = JSON.parse(output);
  } catch (error) {
    return <div>Error loading countdown data</div>;
  }

  const now = new Date();

  return (
    <div className="widget">
      {data.countdowns.map((countdown, index) => {
        const targetDate = new Date(countdown.targetDate);
        const millisecondsLeft = targetDate - now;
        const daysLeft = Math.max(
          0,
          Math.floor(millisecondsLeft / (1000 * 60 * 60 * 24))
        );

        return (
          <div key={index} className="countdown-item">
            <div className="title">{countdown.title}</div>
            <div className="count">{daysLeft}</div>
            <div className="label">days left</div>
          </div>
        );
      })}
    </div>
  );
};

export const className = `
  .widget {
    position: fixed;
    top: 50%;
    left: 25px;
    transform: translateY(-50%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 400px;
  }

  .countdown-item {
    text-align: center;
    padding: 25px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .countdown-item:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  .title {
    font-size: 18px;
    margin-bottom: 15px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    line-height: 1.3;
  }

  .count {
    font-size: 56px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
`;
