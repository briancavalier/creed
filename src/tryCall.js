export default function tryCall (f, x, handle, promise) {
  let result
  // test if `f` (and only it) throws
  try {
    result = f(x)
  } catch (e) {
    promise._reject(e)
    return
  } // else
  handle(promise, result)
}
