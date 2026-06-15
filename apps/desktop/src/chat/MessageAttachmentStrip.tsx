import type React from 'react';
import { pathToAttachmentPreviewUrl } from './message-attachment-display';
import type { QueueAttachmentRef } from './queue-storage';

type MessageAttachmentStripProps = {
  attachments: QueueAttachmentRef[];
};

export const MessageAttachmentStrip: React.FC<MessageAttachmentStripProps> = ({ attachments }) => {
  if (!attachments.length) return null;

  return (
    <div className="msgAttachmentStrip" aria-label="Attached images">
      {attachments.map((attachment) => {
        const previewUrl = pathToAttachmentPreviewUrl(attachment.path);
        return (
          <a
            key={`${attachment.name}:${attachment.path}`}
            className="msgAttachment"
            href={previewUrl}
            title={`Open ${attachment.name}`}
          >
            <img src={previewUrl} alt="" />
            <span className="msgAttachment__name">{attachment.name}</span>
          </a>
        );
      })}
    </div>
  );
};
