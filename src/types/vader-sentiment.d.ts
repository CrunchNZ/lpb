declare module 'vader-sentiment' {
  export interface SentimentResult {
    positive: number;
    negative: number;
    neutral: number;
    compound: number;
  }

  export function sentiment(text: string): SentimentResult;
}
