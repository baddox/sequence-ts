interface Item<T> {
  stop: false;
  item: T;
  next: Sequence<T>;
}
interface StopIteration {
  stop: true;
}
type Step<T> = Item<T> | StopIteration;
export type Sequence<T> = () => Step<T>;
type SequenceGenerator<T> = () => Sequence<T>;

// How do I get it to realize that `create` and `empty` are SequenceGenerators?
export function createStep<T>(item: T, next: Sequence<T>): Step<T> {
  return { item, next, stop: false };
}

export function empty<T>(): Sequence<T> {
  return () => ({ stop: true });
}

export function just<T>(item: T): Sequence<T> {
  return () => createStep(item, empty());
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
      return () => createStep(step.item, chain(step.next, secondGenerator));
  }
}

// How would it not realize the types of these arguments, given that they're
// passed directly to `chain`?
export function andThen<T>(
  secondGenerator: SequenceGenerator<T>,
  firstSequence: Sequence<T>
) {
  return chain<T>(firstSequence, secondGenerator);
}

export function peek<T>() {
  return (sequence: Sequence<T>) => {
    let step = sequence();
    switch (step.stop) {
      case true:
        return null;
      case false:
        return step.item;
    }
  };
}

type reducer<I, A> = (item: I, accumulator: A) => A;

export function reduce<I, A>(reducer: reducer<I, A>, initialAccumulator: A) {
  return (sequence: Sequence<I>) => {
    function helper(accumulator: A, seq: Sequence<I>): A {
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
  };
}

export function map<T, S>(func: (item: T) => S) {
  return (sequence: Sequence<T>): Sequence<S> => {
    const step = sequence();
    switch (step.stop) {
      case true:
        return empty();
      case false:
        return chain(just(func(step.item)), () => map(func)(step.next));
    }
  };
}

export function each<T>(func: (item: T) => void) {
  return (sequence: Sequence<T>) => {
    const step = sequence();
    switch (step.stop) {
      case true:
        return;
      case false:
        func(step.item);
        each(func)(step.next);
    }
  };
}

export function take<T>(count: number) {
  return (sequence: Sequence<T>): Sequence<T> => {
    if (count === 0) {
      return empty();
    }
    const step = sequence();
    switch (step.stop) {
      case true:
        return empty();
      case false:
        return chain<T>(just(step.item), () => take<T>(count - 1)(step.next));
    }
  };
}

export function mapStep<T>(func: (item: T, next: Sequence<T>) => Step<T>) {
  return (sequence: Sequence<T>): Sequence<T> => {
    const step = sequence();
    switch (step.stop) {
      case true:
        return empty();
      case false:
        // Why is this logging twice for each item??
        // console.log("takeWhile", step.item);
        return () => func(step.item, mapStep(func)(step.next));
    }
  };
}

export function takeWhile<T>(predicate: (item: T) => boolean) {
  return (sequence: Sequence<T>): Sequence<T> => {
    return mapStep<T>(
      (item, next) =>
        predicate(item) ? createStep(item, next) : { stop: true }
    )(sequence);
  };
}

export function count(start: number): SequenceGenerator<number> {
  return (): Sequence<number> => {
    let i = start;
    const loop = (): Step<number> => {
      const j = i;
      i += 1;
      // return chain(just(i), () => loop());
      return {
        stop: false,
        item: j,
        next: loop
      };
      // return create(j, loop);
    };
    return loop;
  };
}

export function range(start: number, stop: number): SequenceGenerator<number> {
  return () => {
    return compose(
      count(start),
      takeWhile(i => i <= stop)
    )();
    // takeWhile<number>(i => i <= stop)(count(start)());
  };
}

// `chunk` takes a `sequence` and a `splitChunkHere` predicate and generates
// a sequence of chunks where each chunk is itself a sequence.
// For every item in `sequence`, `splitChunkHere` gets passed the item and the
// previous item, and returns `true` if the chunk should be split between those
// two items.
// Note that this means that chunks can never be empty.
export function chunk<T>(
  splitChunkHere: (
    a: T,
    b: T,
    chunkIndex: number,
    chunkLength: number
  ) => boolean
) {
  return (sequence: Sequence<T>): Sequence<Sequence<T>> => {
    const helper = (
      currentChunk: Sequence<T>,
      previousItem: T,
      chunkIndex: number,
      chunkLength: number,
      seq: Sequence<T>
    ): Sequence<Sequence<T>> => {
      const step = seq();
      switch (step.stop) {
        case true:
          return just(currentChunk);
        case false:
          if (
            splitChunkHere(previousItem, step.item, chunkIndex, chunkLength)
          ) {
            // Return the currentChunk and start a new chunk from the current
            // item;
            const newChunk = just(step.item);
            const restOfTheChunks = () => {
              return helper(newChunk, step.item, chunkIndex + 1, 1, step.next);
            };
            return chain(just(currentChunk), restOfTheChunks);
          } else {
            // Add the current item at the end of the currentChunk.
            const stillCurrentChunk = chain<T>(currentChunk, () =>
              just(step.item)
            );
            // console.log("still current chunk", toArray(stillCurrentChunk));
            return chain(empty(), () => {
              return helper(
                stillCurrentChunk,
                step.item,
                chunkIndex,
                chunkLength + 1,
                step.next
              );
            });
          }
      }
    };
    const step = sequence();
    switch (step.stop) {
      case true:
        return empty();
      case false:
        return chain(empty(), () =>
          helper(just(step.item), step.item, 0, 1, step.next)
        );
    }
  };
}

export function chunkBy<T, S>(makeKey: (item: T) => S) {
  return chunk((a: T, b: T) => makeKey(a) !== makeKey(b));
}

export function length<T>(sequence: Sequence<T>) {
  return reduce((_item, sum) => sum + 1, 0)(sequence);
}

export function compose(...funcs: ((seq: Sequence<any>) => Sequence<any>)[]) {
  return (seq_: Sequence<any> = empty()) => {
    let newArg = seq_;
    funcs.forEach(func => {
      newArg = func(newArg);
    });
    return newArg;
  };
}

export function toArray<T>(sequence: Sequence<T>) {
  // return reduce<T, T[]>((a, item) => [...a, item], [])(sequence);
  const a: T[] = [];
  each<T>(item => a.push(item))(sequence);
  return a;
}
export function fromArray<T>(array: T[]): Sequence<T> {
  if (array.length === 0) {
    return empty();
  } else {
    const [head, ...rest] = array;
    return chain(just(head), () => fromArray(rest));
  }
}
