/** Shared domain types. Feature-local types should live next to their feature. */

export type Id = string;

export type User = {
  id: Id;
  name: string;
  email: string;
  createdAt: string;
};

/** Standard envelope for async UI state. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
