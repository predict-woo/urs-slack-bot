export enum BlockTypeEnum {
  section = "section",
  actions = "actions",
  divider = "divider",
  image = "image",
  context = "context",
  input = "input",
  header = "header",
}

export type TAccessoryType =
  | "users_select"
  | "static_select"
  | "multi_conversations_select"
  | "button"
  | "image"
  | "overflow"
  | "datepicker"
  | "checkboxes"
  | "radio_buttons"
  | "timepicker";

export type TTextType = "plain_text" | "mrkdwn";
export type TTextField = {
  type: string;
  text: TTextType;
  emoji?: boolean;
};
export type TActionId = string;
export type TValue = string;
export type TPlaceholder = TTextField;
export type TTextFieldValue = {
  text: TTextField;
  description?: TTextField;
  value: TValue;
};
export type TOption = TTextFieldValue;
export type TImage = {
  image_url: string;
  alt_text?: string;
};

export type TAccessoryBase = {
  type: TAccessoryType;
};

export type TAccessory = TAccessoryBase & {
  placeholder?: TPlaceholder;
  options?: TOption[];
  action_id?: TActionId;
};

export type TAccessoryButton = TAccessoryBase &
  TTextFieldValue & {
    url?: string;
    action_id: TActionId;
  };

export type TAccessoryImage = TAccessoryBase & TImage;

export type TAccessoryTimePick = TAccessory & {
  initial_time?: string;
};

export type TAccessoryDatePick = TAccessory & {
  initial_date?: string;
};

export type TSectionProps = {
  type: keyof BlockTypeEnum.section;
  text?: TTextField;
  fields?: TTextField[];
  accessory?: TAccessory;
};

export type TActionProps = {
  type: keyof BlockTypeEnum.actions;
  elements:
    | TAccessoryButton[]
    | TAccessoryDatePick[]
    | TAccessoryTimePick[]
    | TAccessory[];
};

export type TDividerProps = {
  type: keyof BlockTypeEnum.divider;
};

export type TImageProps = TImage & {
  type: keyof BlockTypeEnum.image;
  title?: TTextFieldValue;
};

export type TContextProps = {
  type: keyof BlockTypeEnum.context;
  elements: (TTextField | TImageProps)[];
};

export type TInputElementType =
  | "plain_text_input"
  | "multi_users_select"
  | "static_select"
  | "datepicker"
  | "timepicker"
  | "checkboxes"
  | "radio_buttons";

export type TInputElement = {
  type: TInputElementType;
  action_id?: TActionId;
  placeholder?: TPlaceholder;
  options?: TOption[];
  dispatch_action_config?: any;
  multiline?: boolean;
};

export type TInputProps = {
  type: keyof BlockTypeEnum.input;
  dispatch_action?: boolean;
  element: TInputElement | TAccessoryDatePick | TAccessoryTimePick | TAccessory;
  label?: TTextField;
};

export type THeaderProps = {
  type: keyof BlockTypeEnum.header;
  text: TTextField;
};

export type TBlock =
  | TSectionProps
  | TActionProps
  | TDividerProps
  | TImageProps
  | TContextProps
  | TInputProps
  | THeaderProps;

export type TBlocks = TBlock[];
