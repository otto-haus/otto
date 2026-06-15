import type React from 'react';

export type TodoItem = {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
};

const statusLabel: Record<TodoItem['status'], string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Done',
};

export const TodoPanel: React.FC<{ todos: TodoItem[] }> = ({ todos }) => {
  if (!todos.length) return null;
  return (
    <section className="todoPanel" aria-label="Agent task list">
      <div className="todoPanel__head">
        <span className="todoPanel__eyebrow">Tasks</span>
        <span className="todoPanel__count">{todos.length}</span>
      </div>
      <ul className="todoPanel__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`todoItem todoItem--${todo.status}`}
            data-status={todo.status}
          >
            <span className="todoItem__box" aria-hidden="true">
              {todo.status === 'completed' ? '☒' : '☐'}
            </span>
            <span className="todoItem__content">{todo.content}</span>
            <span className="todoItem__status srOnly">{statusLabel[todo.status]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
