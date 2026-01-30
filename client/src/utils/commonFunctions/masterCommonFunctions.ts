// src/utils/commonFunctions/masterCommonFunctions.ts
export const showGlobalError = (message: string) => {
  // You can implement this with a toast library or custom UI component
  console.error(message);
  
  // Dispatch a custom event that components can listen for
  const event = new CustomEvent('globalError', {
    detail: { message },
  });
  window.dispatchEvent(event);
};
