import type React from 'react';
import { useEffect, useState } from 'react';
import { pathToAttachmentPreviewUrl } from './message-attachment-display';
import type { QueueAttachmentRef } from './queue-storage';
import { ottoApi } from '../runtime';

type MessageAttachmentStripProps = {
  attachments: QueueAttachmentRef[];
};

export const MessageAttachmentStrip: React.FC<MessageAttachmentStripProps> = ({ attachments }) => {
  const [previewById, setPreviewById] = useState<Record<string, string>>({});

  useEffect(() => {
    const api = ottoApi();
    const unresolved = attachments.filter((attachment) => !attachment.path && attachment.id);
    if (!api || !unresolved.length) return;
    void api.attachments.resolve(unresolved.map((attachment) => attachment.id!)).then((records) => {
      setPreviewById((prev) => {
        const next = { ...prev };
        for (const record of records) {
          next[record.id] = record.url;
        }
        return next;
      });
    });
  }, [attachments]);

  if (!attachments.length) return null;

  return (
    <div className="msgAttachmentStrip" aria-label="Attached images">
      {attachments.map((attachment) => {
        const previewUrl = attachment.path
          ? pathToAttachmentPreviewUrl(attachment.path)
          : attachment.id
            ? previewById[attachment.id] ?? ''
            : '';
        return (
          <a
            key={`${attachment.name}:${attachment.id ?? attachment.path}`}
            className="msgAttachment"
            href={previewUrl || undefined}
            title={`Open ${attachment.name}`}
          >
            {previewUrl ? <img src={previewUrl} alt="" /> : <span className="msgAttachment__placeholder" aria-hidden="true" />}
            <span className="msgAttachment__name">{attachment.name}</span>
          </a>
        );
      })}
    </div>
  );
};
