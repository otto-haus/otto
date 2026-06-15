import type { Components } from 'streamdown';

/** Map Streamdown output to otto chat markdown tokens (no Tailwind build). */
export const streamdownComponents: Components = {
  p: ({ children }) => <p className="md__p">{children}</p>,
  h1: ({ children }) => <h3 className="md__heading">{children}</h3>,
  h2: ({ children }) => <h4 className="md__heading">{children}</h4>,
  h3: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h4: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h5: ({ children }) => <h5 className="md__heading">{children}</h5>,
  h6: ({ children }) => <h5 className="md__heading">{children}</h5>,
  ul: ({ children }) => <ul className="md__list">{children}</ul>,
  ol: ({ children }) => <ol className="md__list">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="md__quote">{children}</blockquote>,
  pre: ({ children }) => <pre className="md__pre">{children}</pre>,
  table: ({ children }) => (
    <div className="md__tableWrap">
      <table className="md__table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

export const streamdownCommonProps = {
  className: 'md__block',
  controls: false as const,
  lineNumbers: false,
  animated: false as const,
  components: streamdownComponents,
};
