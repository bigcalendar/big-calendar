// The public face of the signals facade (D-07, reactivity). Never the backing library's types.

/** A read-only signal, shaped like TC39 `Signal.Computed`. */
export interface ReadonlySignal<T> {
  get(): T
}

/** A writable signal the app owns and the calendar can be bound to (D-53). */
export interface Atom<T> extends ReadonlySignal<T> {
  set(value: T): void
}

/** Creates an atom to bind a state slice to (`atoms` option). */
export declare function createAtom<T>(initial: T): Atom<T>
