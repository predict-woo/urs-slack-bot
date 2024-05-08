import { format, toZonedTime } from "date-fns-tz";
import { nextThursday } from "date-fns";
import { ko } from "date-fns/locale";
import { ChatCompletionTool } from "openai/resources";

const timeZone = "Asia/Seoul";

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "successfully_extract_reservation",
      description: "요청에 오류가 없을때 정보를 추출합니다.",
      parameters: {
        type: "object",
        properties: {
          roomId: {
            type: "string",
            enum: [
              "N10_GROUP_STUDY_ROOM_1",
              "N10_GROUP_STUDY_ROOM_2",
              "N10_GROUP_STUDY_ROOM_3",
              "N10_GROUP_STUDY_ROOM_4",
              "N10_GROUP_STUDY_ROOM_5",
              "N10_GROUP_STUDY_ROOM_6",
              "N10_GROUP_STUDY_ROOM_7",
              "N10_GROUP_STUDY_ROOM_8",
              "N10_GROUP_STUDY_ROOM_A",
              "N10_GROUP_STUDY_ROOM_B",
              "N10_GROUP_STUDY_ROOM_C",
              "N10_GROUP_STUDY_ROOM_D",
              "E9_GROUP_STUDY_ROOM_2A",
              "E9_GROUP_STUDY_ROOM_2B",
              "E9_GROUP_STUDY_ROOM_3A",
              "E9_GROUP_STUDY_ROOM_3B",
              "E9_GROUP_STUDY_ROOM_3C",
              "E9_GROUP_STUDY_ROOM_3D",
              "E9_GROUP_STUDY_ROOM_4A",
              "E9_GROUP_STUDY_ROOM_4B",
              "E9_GROUP_STUDY_ROOM_4C",
              "E9_GROUP_STUDY_ROOM_4D",
              "E9_COLLABORATION_ROOM_4A",
              "E9_COLLABORATION_ROOM_4B",
              "E9_COLLABORATION_ROOM_4C",
              "E9_COLLABORATION_ROOM_4D",
              "E9_COLLABORATION_ROOM_4E",
              "E9_COLLABORATION_ROOM_4F",
              "E9_COLLABORATION_ROOM_4G",
              "E9_COLLABORATION_ROOM_4H",
              "E9_COLLABORATION_ROOM_4I",
              "E9_COLLABORATION_ROOM_4J",
              "E9_MEDIA_ROOM_4A",
              "E9_MEDIA_ROOM_4B",
              "E9_MEDIA_ROOM_4C",
              "E9_MEDIA_STUDIO",
              "E9_MEDIA_EDIT_ROOM_A",
              "E9_MEDIA_EDIT_ROOM_B",
              "E9_MEDIA_EDIT_ROOM_C",
              "E9_MEDIA_EDIT_ROOM_D",
              "F109_GROUP_STUDY_ROOM_1F",
              "F109_GROUP_STUDY_ROOM_3F",
            ],
            description: "Room ID",
          },
          date: {
            type: "string",
            format: "date-time",
            description:
              "Date of reservation in ISO8601 format. ex) 2022-09-29T18:00:00+09:00",
          },
          duration: {
            type: "object",
            properties: {
              hour: {
                type: "number",
                enum: [0, 1, 2],
                description: "Duration in hours",
              },
              minute: {
                type: "number",
                enum: [0, 30],
                description: "Duration in minutes",
              },
            },
            required: ["hour", "minute"],
            description: "Duration of reservation",
          },
          title: {
            type: "string",
            description: "Title of reservation",
          },
          studentId: {
            type: "string",
            description: "Student ID of the person who made the reservation",
          },
          members: {
            type: "array",
            items: {
              type: "object",
              properties: {
                studentId: {
                  type: "string",
                  description: "Student ID of the member ex) 20200000",
                },
                name: {
                  type: "string",
                  description: "Name of the member ex) 홍길동",
                },
              },
              required: ["studentId", "name"],
            },
            description:
              "Members of the reservation. Does not include the person who made the reservation",
          },
        },
        required: [
          "roomId",
          "date",
          "duration",
          "title",
          "studentId",
          "members",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "failed_extract_reservation",
      description: "요청에 오류가 있을때 오류 메시지를 반환합니다.",
      parameters: {
        type: "object",
        properties: {
          error_message: {
            type: "string",
            description: "Error message",
          },
        },
        required: ["error_message"],
      },
    },
  },
];

const prompt = `
## 소개
저는 사용자의 요청을 받아 특정방을 예약하는 봇입니다.
저는 아래 ReturnType을 따르는 JSON을 반환합니다.
*하지만 요청에 누락된 정보가 있거나 예약 가능한 객실 또는 시간이 여러 개 있는 경우 오류 메시지를 반환합니다.*

! 중요 !
오류 상황의 예는 다음과 같은 경우가 있을 수 있습니다.
- 참석자가 존재하지 않습니다
- 참석자의 학번이나 이름이 누락된 경우 오류 메시지를 반환합니다. 무조건 둘 다 입력해야 합니다.
- 예약하자가 존재하지 않습니다
- 예약자의 학번이나 이름이 누락된 경우 오류 메시지를 반환합니다. 무조건 둘 다 입력해야 합니다.
- 사용자가 요청한 방이 존재하지 않으면 오류 메시지를 반환합니다.
- 사용자가 요청한 방의 내용이 부정확하여 여러개의 방으로 해석될 수 있는 경우 오류 메시지를 반환합니다.
- 사용자가 날짜나 시간을 명시하지 않은 경우 오류 메시지를 반환합니다.
- 사용자가 예약하는 기간을 명시하지 않은 경우 오류 메시지를 반환합니다.
- 예약 가능한 시간이 여러 개인 경우 오류 메시지를 반환합니다.
- 등등 이외의 모순되거나 부족한 정보가 있는 경우 오류 메시지를 반환합니다.

저는 다음과 같은 ReturnType을 따릅니다.
{
  roomId: "N10_GROUP_STUDY_ROOM_1" | "N10_GROUP_STUDY_ROOM_2" | "N10_GROUP_STUDY_ROOM_3" | 
  "N10_GROUP_STUDY_ROOM_4" | "N10_GROUP_STUDY_ROOM_5" | "N10_GROUP_STUDY_ROOM_6" | 
  "N10_GROUP_STUDY_ROOM_7" | "N10_GROUP_STUDY_ROOM_8" | "N10_GROUP_STUDY_ROOM_A" | 
  "N10_GROUP_STUDY_ROOM_B" | "N10_GROUP_STUDY_ROOM_C" | "N10_GROUP_STUDY_ROOM_D" | 
  "E9_GROUP_STUDY_ROOM_2A" | "E9_GROUP_STUDY_ROOM_2B" | "E9_GROUP_STUDY_ROOM_3A" | 
  "E9_GROUP_STUDY_ROOM_3B" | "E9_GROUP_STUDY_ROOM_3C" | "E9_GROUP_STUDY_ROOM_3D" | 
  "E9_GROUP_STUDY_ROOM_4A" | "E9_GROUP_STUDY_ROOM_4B" | "E9_GROUP_STUDY_ROOM_4C" | 
  "E9_GROUP_STUDY_ROOM_4D" | "E9_COLLABORATION_ROOM_4A" | "E9_COLLABORATION_ROOM_4B" | 
  "E9_COLLABORATION_ROOM_4C" | "E9_COLLABORATION_ROOM_4D" | "E9_COLLABORATION_ROOM_4E" | 
  "E9_COLLABORATION_ROOM_4F" | "E9_COLLABORATION_ROOM_4G" | "E9_COLLABORATION_ROOM_4H" | 
  "E9_COLLABORATION_ROOM_4I" | "E9_COLLABORATION_ROOM_4J" | "E9_MEDIA_ROOM_4A" | 
  "E9_MEDIA_ROOM_4B" | "E9_MEDIA_ROOM_4C" | "E9_MEDIA_STUDIO" | "E9_MEDIA_EDIT_ROOM_A" | 
  "E9_MEDIA_EDIT_ROOM_B" | "E9_MEDIA_EDIT_ROOM_C" | "E9_MEDIA_EDIT_ROOM_D" | 
  "F109_GROUP_STUDY_ROOM_1F" | "F109_GROUP_STUDY_ROOM_3F";
  date: Date;
  duration:
    | { hour: 0; minute: 30 }
    | { hour: 1; minute: 0 }
    | { hour: 1; minute: 30 }
    | { hour: 2; minute: 0 };
  title: string;
  studentId: string;
  members: { studentId: string; name: string }[];
};

## 추가적인 정보
오늘의 날짜는 ${format(toZonedTime(new Date(), timeZone), "yyyy-MM-dd EEEE", {
  locale: ko,
  timeZone,
})} 이고,
현재 시각은 ${format(toZonedTime(new Date(), timeZone), "aaaaa HH:mm", {
  locale: ko,
  timeZone,
})} 입니다
저는 timezone이 UTC+9인 한국 서울에 있습니다.

N10 = 교양분관, 교분
E9 = 도서관, 문화관, 학술관, 학술문화관
F109 = 문지도서관
N10_GROUP_STUDY_ROOM 의 방들은 "세미나실"이라고 부르기도 합니다


## 성공적인 예시

요청:

세미나실 1번을 목요일 오후 6시에 1시간 예약
예약자: 20220414 예상우
참석자: 20220000 홍길동


응답:
{
  roomId: "N10_GROUP_STUDY_ROOM_1",
  date: ${format(
    nextThursday(toZonedTime(new Date(), timeZone)),
    "yyyy-MM-dd'T'18:00:00XX",
    {
      locale: ko,
      timeZone: "Asia/Seoul",
    }
  )} ,
  duration: { hour: 1, minute: 0 },
  title: "1번 세미나실 예약",
  studentId: "20220414",
  members: [{ studentId: "20220000", name: "홍길동" }],
}

## 실패한 예시

Request:
도서관 4층 4A 스터디룸을 예약
예약자: 20220414 예상우
참석자: 홍길동

Response:
{
  error_message: "학생 번호가 누락되었습니다. 참석자의 학생 번호를 입력해 주세요."
}
`;

export { tools, prompt };
