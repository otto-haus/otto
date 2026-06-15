import type { ChatMsg } from '../runtime';

export type ConversationMarkdownInput = {
  title: string;
  exportedAt?: string;
  threadId?: string | null;
  conversationId?: string | null;
  messages: ChatMsg[];
};

const LOCAL_PATH =
  /(?:~\/[^\s"'`,)]+|\/(?:Users|home|var|tmp|Applications|opt|private)[^\s"'`,)]*|file:\/\/[^\s"'`,)]+|[A-Za-z]:\\(?:Users|Program Files)[^\s"'`,)]*)/g;

const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|pk|rk|xox[baprs]-)[-a-zA-Z0-9]{8,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{8,}\b/gi,
  /\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*['"]?[A-Za-z0-9._-]{8,}/gi,
];

export function redactSensitiveContent(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[redacted: secret]');
  }
  out = out.replace(LOCAL_PATH, '[redacted: local path]');
  return out;
}

function messageTimestamp(id: string): string | null {
  const match = id.match(/(?:^|-)(\d{13})(?:$|-)/);
  if (!match) return null;
  const ms = Number(match[1]);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function speakerLabel(who: ChatMsg['who']): string {
  if (who === 'user') return 'You';
  if (who === 'error') return 'Error';
  return 'otto';
}

function formatCheckBlock(block: NonNullable<ChatMsg['checkBlock']>): string {
  const lines = [`> **Check block:** ${block.checkName}`, `> ${block.message}`];
  if (block.receiptId) lines.push(`> Receipt: \`${block.receiptId}\``);
  if (block.standardId) lines.push(`> Standard: \`${block.standardId}\``);
  return lines.join('\n');
}

function formatReceiptInline(receipt: NonNullable<ChatMsg['receiptInline']>): string {
  const lines = [
    `> **Receipt:** \`${receipt.id}\` · ${receipt.status}`,
    `> Action: \`${receipt.action}\``,
    `> ${receipt.summary}`,
  ];
  if (receipt.authority) lines.push(`> Authority: ${receipt.authority}`);
  return lines.join('\n');
}

function formatMessageBody(text: string): string {
  const attachmentLines = text
    .split('\n')
    .map((line) => {
      const attachment = line.match(/^(\d+\.\s+.+?)\s+—\s+(.+)$/);
      if (attachment) return `${attachment[1]} — [attachment: local file]`;
      return line;
    })
    .join('\n');
  return redactSensitiveContent(attachmentLines.trim());
}

function formatMessage(msg: ChatMsg): string {
  const parts: string[] = [];
  const ts = messageTimestamp(msg.id);
  const heading = ts ? `## ${speakerLabel(msg.who)} · ${ts}` : `## ${speakerLabel(msg.who)}`;
  parts.push(heading);
  if (msg.checkBlock) parts.push(formatCheckBlock(msg.checkBlock));
  if (msg.receiptInline) parts.push(formatReceiptInline(msg.receiptInline));
  const body = formatMessageBody(msg.text);
  if (body) parts.push(body);
  return parts.join('\n\n');
}

export function serializeConversationMarkdown(input: ConversationMarkdownInput): string {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const meta: string[] = [`_Exported from otto · ${exportedAt}_`];
  if (input.threadId) meta.push(`_Thread: ${input.threadId}_`);
  if (input.conversationId) meta.push(`_Conversation: ${input.conversationId}_`);
  meta.push('_Local paths and likely secrets are redacted._');

  const sections = [
    `# ${input.title.trim() || 'Conversation'}`,
    '',
    meta.join('\n'),
    '',
    '---',
    '',
  ];

  if (input.messages.length === 0) {
    sections.push('_No messages in this thread yet._', '');
    return sections.join('\n');
  }

  for (const msg of input.messages) {
    sections.push(formatMessage(msg), '', '---', '');
  }

  return sections.join('\n').replace(/\n---\n\n$/, '\n');
}
