import { Keys } from "@kaistian/types";
import { Room } from "../urs";

export type RoomName = Keys<typeof Room>;

export type RoomReservation = {
  roomId: RoomName;
  date: string;
  duration:
    | { hour: 0; minute: 30 }
    | { hour: 1; minute: 0 }
    | { hour: 1; minute: 30 }
    | { hour: 2; minute: 0 };
  title: string;
  studentId: string;
  members: { studentId: string; name: string }[];
};
