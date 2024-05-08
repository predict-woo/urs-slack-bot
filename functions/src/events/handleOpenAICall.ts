import OpenAI from "openai";
import { tools, prompt } from "../prompt/prompt";
import { sendCheck, sendError } from "../slack/sendMessage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const callOpenAI = async (body: any) => {
  const request = body.event.text;
  const channel = body.event.channel;

  if (!request) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Bad Request" }),
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    tools,
    messages: [
      {
        role: "assistant",
        content: prompt,
      },
      { role: "user", content: request },
      {
        role: "user",
        content:
          "제가 정보를 정확하게 입력하지 않았을 수도 있으니, 빠지거나 문제있는 정보가 있다면 알려주세요",
      },
    ],
    tool_choice: "auto",
  });

  // Check if the completion is successful
  if (
    completion.choices[0].message.tool_calls![0].function.name !==
    "successfully_extract_reservation"
  ) {
    await sendError(channel, "예약 정보를 정확히 입력해주세요");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/" },
      body: { message: "failed" },
    };
  }

  const args = JSON.parse(
    completion.choices[0].message.tool_calls![0].function.arguments
  );

  await sendCheck(channel, `\`\`\`${JSON.stringify(args, null, 2)}\`\`\``);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "success" }),
  };
};
