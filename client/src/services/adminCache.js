/**
 * DevPrep - In-Memory Admin Cache (`adminCache.js`)
 * 
 * Caches questions and MCQ bank data during the user's active session to
 * eliminate blank flashes and layout shifts during background refreshes.
 */
export const adminCache = {
  questions: null,
  mcqs: null,
  topicCounts: null,

  setQuestions(list) {
    this.questions = Array.isArray(list) ? list : null;
  },

  getQuestions() {
    return this.questions;
  },

  setMcqs(list, counts = null) {
    this.mcqs = Array.isArray(list) ? list : null;
    if (counts) this.topicCounts = counts;
  },

  getMcqs() {
    return this.mcqs;
  },

  getTopicCounts() {
    return this.topicCounts;
  },

  clear() {
    this.questions = null;
    this.mcqs = null;
    this.topicCounts = null;
  }
};
