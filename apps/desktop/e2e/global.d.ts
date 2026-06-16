/** Minimal renderer bridge types for CDP smoke evaluate() blocks. */
declare global {
  interface Window {
    otto?: {
      threads: {
        list: () => Promise<{
          activeThreadId: string | null;
          threads: Array<{ id: string; title: string }>;
        }>;
        touch: (opts: { title: string }) => Promise<void>;
        switch: (threadId: string) => Promise<void>;
      };
      runtime?: {
        status?: () => { ready?: boolean };
      };
    };
  }
}

export {};
