interface Item<T> {
  stop: false;
  item: T;
  next: Sequence<T>;
}
interface StopIteration {
  stop: true;
}
type Step<T> = Item<T> | StopIteration;
type Sequence<T> = () => Step<T>;
type SequenceGenerator<T> = () => Sequence<T>;

// How do I get it to realize that `create` and `empty` are SequenceGenerators?
export function create<T>(item: T, next: Sequence<T>): Sequence<T> {
  return () => ({ item, next, stop: false });
}

export function empty<T>(): Sequence<T> {
  return () => ({ stop: true });
}

export function just<T>(item: T) {
  return create(item, empty());
}

export function chain<T>(
  firstSequence: Sequence<T>,
  secondGenerator: SequenceGenerator<T>
): Sequence<T> {
  const step = firstSequence();
  switch (step.stop) {
    case true:
      return secondGenerator();
    case false:
      return create(step.item, chain(step.next, secondGenerator));
  }
}

// How would it not realize the types of these arguments, given that they're
// passed directly to `chain`?
export function andThen(secondGenerator, firstSequence) {
  return chain(firstSequence, secondGenerator);
}

export function reduce(reducer, initialAccumulator, sequence) {
  function helper(accumulator, seq) {
    const step = seq();
    switch (step.stop) {
      case true:
        return accumulator;
      case false:
        const newAccumulator = reducer(step.item, accumulator);
        return helper(newAccumulator, step.next);
    }
  }
  return helper(initialAccumulator, sequence);
}

export function map(func, sequence) {
  const step = sequence();
  switch (step.stop) {
    case true:
      return empty();
    case false:
      return chain(just(func(step.item)), () => map(func, step.next));
  }
}

export function each(func, sequence) {
  map(func, sequence);
}

export function takeWhile(predicate, sequence) {
  const step = sequence();
  switch (step.stop) {
    case true:
      return empty();
    case false:
      return predicate(step.item)
        ? chain(just(step.item), () => takeWhile(predicate, step.next))
        : empty();
  }
}

export function count(start: number): Sequence<number> {
  return chain(just(start), () => count(start + 1));
}

export function toArray(sequence) {
  return reduce((a, item) => [...a, item], [], sequence);
}

export function compose(...funcs: ((x: any) => any)[]) {
  return arg => {
    let newArg;
    funcs.forEach(func => (newArg = func(newArg)));
    return newArg;
  };
}
