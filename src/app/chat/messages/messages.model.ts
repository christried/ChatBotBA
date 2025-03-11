export interface Message {
  id: number;
  from: string;
  content: string;
  timestamp: Date;
}

export type Messages = Message[];
