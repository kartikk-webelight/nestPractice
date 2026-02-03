export const QUEUE_OPTIONS = {
  DEFAULT_RETRY: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
  },
};
