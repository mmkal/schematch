export class NonExhaustiveError extends Error {
  constructor(public input: unknown) {
    let displayedValue
    try {
      displayedValue = JSON.stringify(input)
    } catch {
      displayedValue = input
    }
    super(`Schema matching error: no schema matches value ${displayedValue}`)
  }
}
