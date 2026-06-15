import type React from 'react';
import type { SurfaceId } from '../components/Sidebar';
import { chatCopy } from '../copy/surfaces';
import type { TodoItem } from '../runtime';
import { DURABLE_PROMOTION_SURFACES, formatChatHandoffSummary, nextActionFromTodos } from './chat-surface-contract';

export const ChatHandoffStrip: React.FC<{
  todos: TodoItem[];
  onNavigate: (id: SurfaceId) => void;
}> = ({ todos, onNavigate }) => {
  const summary = formatChatHandoffSummary({ nextAction: nextActionFromTodos(todos) ?? undefined });
  return (
    <aside className="inkblock chatHandoff" aria-label={chatCopy.handoffEyebrow}>
      <div className="inkblock__eyebrow">{chatCopy.handoffEyebrow}</div>
      <p className="inkblock__meta">{chatCopy.handoffEphemeralNote}</p>
      {summary ? <p className="faint chatHandoff__summary">{summary}</p> : null}
      <div className="inkblock__actions chatHandoff__promote">
        {DURABLE_PROMOTION_SURFACES.map((id) => (
          <button key={id} type="button" className="btn btn--ghost-d" onClick={() => onNavigate(id)}>
            {chatCopy.handoffPromoteLabel(id)}
          </button>
        ))}
      </div>
    </aside>
  );
};
