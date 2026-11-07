// A component for the React Compiler check: the compiler memoizes its output.
/** Greets someone by name. */
export function Greeting({ name }: { name: string }) {
  const message = `Hello, ${name}`
  return <p>{message}</p>
}
Greeting.displayName = 'Greeting'
