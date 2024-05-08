import { callOpenAI } from "./events/handleOpenAICall";

const base64Decode = (text: string) =>
  Buffer.from(text, "base64").toString("utf8");

export const handler = async (event: any) => {
  const encBody =
    event.Records.length && base64Decode(event.Records[0].Sns.Message);

  // check if the event is from SNS
  if (!encBody) return;

  const { type, ...body } = JSON.parse(encBody);
  console.log(type, body);

  switch (type) {
    case "url_verification":
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: body.challenge }),
      };
    case "event_callback":
      if (body.event.type === "app_mention") {
        await callOpenAI(body);
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    default:
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Bad Request" }),
      };
  }
};
