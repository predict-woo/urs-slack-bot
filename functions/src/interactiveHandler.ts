import { editErrorMessage, editSuccessMessage } from "./slack/editMessage";
import { Room } from "./urs";
import { reserveRoom } from "./urs/reserveRoom";

interface User {
  id: string;
  username: string;
  name: string;
  team_id: string;
}

interface Team {
  id: string;
  domain: string;
}

interface Message {
  user: string;
  type: string;
  ts: string;
  bot_id?: string;
  app_id?: string;
  text: string;
  blocks: any[];
}

interface Container {
  type: string;
  message_ts: string;
  channel_id: string;
  is_ephemeral: boolean;
}

interface Payload {
  type: string;
  user: User;
  api_app_id: string;
  token: string;
  container: Container;
  trigger_id: string;
  team: Team;
  message: Message;
}

export const handler = async (event: any) => {
  const payload = JSON.parse(
    decodeURIComponent(event.body).substring("payload=".length)
  ) as Payload;

  const { blocks } = payload.message;

  if (blocks.length !== 3) return { statusCode: 400 };

  const message: string = blocks[1].text.text;

  const reservationInfo = JSON.parse(
    message.substring(3, message.length - 3).replace(/(?<!\d)\+|\+(?!\d)/g, " ")
  );

  const reservation = {
    roomId: Room[reservationInfo.roomId as keyof typeof Room],
    date: new Date(reservationInfo.date),
    duration: reservationInfo.duration,
    title: reservationInfo.title,
    studentId: reservationInfo.studentId,
    members: reservationInfo.members,
  };

  console.log("reservation", reservation);
  const reserveRoomRes = await reserveRoom(reservation);
  console.log("reserveRoomRes", reserveRoomRes);

  const { channel_id, message_ts } = payload.container;

  if (reserveRoomRes?.ok === false) {
    await editErrorMessage(channel_id, message_ts);
    return { statusCode: 200, body: JSON.stringify({ message: "failed" }) };
  }

  await editSuccessMessage(channel_id, message_ts);
  return { statusCode: 200, body: JSON.stringify({ message: "success" }) };
};
