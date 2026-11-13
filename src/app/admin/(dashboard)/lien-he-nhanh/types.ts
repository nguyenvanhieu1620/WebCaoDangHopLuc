export const TYPE_LABELS = {
  hotline: "Hotline",
  zalo: "Zalo",
  facebook: "Facebook Messenger",
  message: "Tin nhắn / SMS",
  chatbot: "ChatbotAI",
  custom: "Khác",
} as const;

export type QuickContactType = keyof typeof TYPE_LABELS;

export function isQuickContactType(type: string): type is QuickContactType {
  return Object.hasOwn(TYPE_LABELS, type);
}
