import { WebClient } from "@slack/web-api";

const bot = new WebClient(process.env.SLACK_API_TOKEN);

const editSuccessMessage = async (channel: string, ts: string) => {
  try {
    const newBlocks = [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "예약을 완료하였습니다!",
                style: {
                  bold: true,
                },
              },
            ],
          },
        ],
      },
    ];

    const response = await bot.chat.update({
      channel: channel,
      ts: ts,
      blocks: newBlocks,
      text: "예약을 완료하였습니다!",
    });

    console.log("Message updated:", response.ok);
  } catch (error) {
    console.error("Error updating message:", error);
  }
};

const editErrorMessage = async (channel: string, ts: string) => {
  try {
    const newBlocks = [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "예약을 실패하였습니다.",
                style: {
                  bold: true,
                },
              },
            ],
          },
        ],
      },
    ];

    const response = await bot.chat.update({
      channel: channel,
      ts: ts,
      blocks: newBlocks,
      text: "예약을 실패하였습니다.",
    });

    console.log("Message updated:", response.ok);
  } catch (error) {
    console.error("Error updating message:", error);
  }
};

export { editSuccessMessage, editErrorMessage };
