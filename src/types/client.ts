export interface Client {
  email: string;
  name: string;
  course?: string | null;
  meetings: number;
  lastMeeting: string | null;
  phoneNumber?: string | null;
}
