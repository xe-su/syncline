let lastPhysical = 0
let counter = 0

export function hlcNow(): number {
  const physical = Date.now()
  if (physical > lastPhysical) {
    lastPhysical = physical
    counter = 0
  } else {
    counter++
  }
  return lastPhysical * 1000 + counter
}

export function hlcRecv(remote: number): number {
  const remotePhysical = Math.floor(remote / 1000)
  const physical = Date.now()
  const newPhysical = Math.max(physical, remotePhysical, lastPhysical)

  if (newPhysical === lastPhysical && newPhysical === remotePhysical) {
    counter = Math.max(counter, remote % 1000) + 1
  } else if (newPhysical === lastPhysical) {
    counter++
  } else if (newPhysical === remotePhysical) {
    counter = (remote % 1000) + 1
  } else {
    counter = 0
  }

  lastPhysical = newPhysical
  return lastPhysical * 1000 + counter
}
