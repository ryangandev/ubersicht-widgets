export const PRESETS = {
  focus: {
    width: 430,
    position: { top: 28, right: 28 },
    summaryColumns: "repeat(3, minmax(0, 1fr))",
    sectionColumns: "1fr",
    limits: {
      goals: 2,
      habits: 3,
      activeCountdowns: 2,
      completedCountdowns: 1,
    },
    showCompletedCountdowns: false,
  },
  balanced: {
    width: 620,
    position: { top: 28, right: 28 },
    summaryColumns: "repeat(3, minmax(0, 1fr))",
    sectionColumns: "repeat(2, minmax(0, 1fr))",
    limits: {
      goals: 3,
      habits: 4,
      activeCountdowns: 4,
      completedCountdowns: 2,
    },
    showCompletedCountdowns: true,
  },
  compact: {
    width: 360,
    position: { top: 20, right: 20 },
    summaryColumns: "1fr",
    sectionColumns: "1fr",
    limits: {
      goals: 2,
      habits: 3,
      activeCountdowns: 2,
      completedCountdowns: 1,
    },
    showCompletedCountdowns: true,
  },
};

export const PRESET_NAMES = Object.keys(PRESETS);

export const getPreset = (preset) => PRESETS[preset] || PRESETS.balanced;
