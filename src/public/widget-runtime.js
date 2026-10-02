// Adapter for previewing the exact Übersicht renderer in a browser.
// Native shell execution is replaced with navigation to this local app.
export const run = async (command) => {
  if (command.includes('?capture=1#queue')) location.assign('/?capture=1#queue');
  else if (command.includes('#today')) location.assign('/#today');
  else throw new Error('Unsupported preview action');
};
