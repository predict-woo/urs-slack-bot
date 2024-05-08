import { WebClient } from "@slack/web-api";

const bot = new WebClient(process.env.SLACK_API_TOKEN);

const sendCheck = async (channel: string, text: string) => {
  const blocks = [
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            {
              type: "text",
              text: "다음 정보로 예약합니다.",
              style: {
                bold: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "checkboxes",
          options: [
            {
              text: {
                type: "plain_text",
                text: "위 정보가 정확함을 확인합니다",
                emoji: true,
              },
              value: "value-reserve",
            },
          ],
          action_id: "action-reserve",
        },
      ],
    },
  ];

  await bot.chat.postMessage({ channel, blocks });
};

const sendError = async (channel: string, text: string) => {
  const blocks = [
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            {
              type: "emoji",
              name: "warning",
            },
            {
              type: "text",
              text: "  ",
            },
            {
              type: "text",
              text,
              style: {
                bold: true,
              },
            },
          ],
        },
      ],
    },
  ];
  await bot.chat.postMessage({ channel, blocks });
};

export { sendCheck, sendError };
