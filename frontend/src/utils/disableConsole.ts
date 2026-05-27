export const disableConsoleOutput = () => {
  const silent = () => {};

  console.log = silent;
  console.info = silent;
  console.warn = silent;
  console.error = silent;
  console.debug = silent;
  console.trace = silent;
};