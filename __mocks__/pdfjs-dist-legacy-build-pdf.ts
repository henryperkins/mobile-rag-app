export const GlobalWorkerOptions = { workerSrc: "" };

export function getDocument() {
  return {
    promise: Promise.resolve({
      numPages: 0,
      getPage: async () => ({
        getTextContent: async () => ({ items: [] })
      })
    })
  };
}
