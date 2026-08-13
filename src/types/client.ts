export interface Client {
  email: string;
  name: string;
  meetings: number;
  lastMeeting: string | null;
  phoneNumber?: string | null;
}
