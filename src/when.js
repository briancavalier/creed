export default function when (r, f, p) {
  p._when(new When(r, f))
}

class When {
  constructor (r, f) {
    this.f = f
    this.r = r
  }

  fulfilled (p) {
    const f = this.f
    f(p.value)
  }

  rejected (p) {
    const r = this.r
    r(p.value)
  }
}
