import {
  Sequence,
  count,
  toArray,
  take,
  takeWhile,
  map,
  each,
  compose,
  range,
  chunk,
  chunkBy,
  peek,
  tail,
  length,
  empty,
  mapStep,
  fromArray,
  chain,
  just,
  createStep,
  nth,
  reduce,
  groupBy,
  indexBy,
  slices,
  conses
} from "./sequence";

describe("each", () => {
  test("sum up some numbers", () => {
    const seq = fromArray([0, 1, 2, 3, 4, 5]);
    const sum = 0;
    each<number>(i => (sum += i))(seq);
    expect(sum).toEqual(15);
  });
});

describe("fromArray", () => {
  test("works", () => {
    const seq = fromArray([0, 1, 2, 3, 4, 5]);
    expect(toArray(seq)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("map", () => {
  test("doubles numbers", () => {
    const seq = map<number, number>(i => i * 2)(fromArray([0, 1, 2]));
    expect(toArray(seq)).toEqual([0, 2, 4]);
  });
});

describe("count", () => {
  test("count with start 0", () => {
    const seq = compose(
      count(0),
      takeWhile(i => i < 5)
    )();
    expect(toArray(seq)).toEqual([0, 1, 2, 3, 4]);
  });
  test("count with start 5", () => {
    const seq = compose(
      count(5),
      takeWhile(i => i < 8)
    )();
    expect(toArray(seq)).toEqual([5, 6, 7]);
  });
});

describe("range", () => {
  test("normal range", () => {
    const seq = range(1, 3)();
    expect(toArray(seq)).toEqual([1, 2, 3]);
  });
  test("range of size 1", () => {
    const seq = range(3, 3)();
    expect(toArray(seq)).toEqual([3]);
  });
  test("empty range", () => {
    const seq = range(3, 1)();
    expect(toArray(seq)).toEqual([]);
  });
  test("huge range", () => {
    // Going to 10,000 blows the stack.
    const seq = range(1, 1000)();
    expect(length(seq)).toEqual(1000);
  });
});

describe("take", () => {
  test("take from infinite counter", () => {
    const seq = compose(
      count(1),
      take(2)
    )();
    expect(toArray(seq)).toEqual([1, 2]);
  });
  test("take from massive range", () => {
    // This should be lazy and thus not blow the stack.
    const seq = compose(
      range(0, 1000000000000),
      take(3)
    )();
    expect(toArray(seq)).toEqual([0, 1, 2]);
  });
  test("take from infinite chunk", () => {
    const seq = compose(
      count(0),
      chunk((a, b) => b % 3 === 0),
      take(3)
    )();
    expect(length(seq)).toEqual(3);
  });
});

describe("chunk", () => {
  test("normal range", () => {
    const seq = compose(
      range(0, 9),
      chunk<number>((_a, b) => b % 3 === 0)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9]
    ]);
  });
  test("every item is its own chunk", () => {
    const seq = compose(
      range(0, 5),
      chunk<number>((_a, _b) => true)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([[0], [1], [2], [3], [4], [5]]);
  });
  test("every item is in the same chunk", () => {
    const seq = compose(
      range(0, 5),
      chunk<number>((_a, _b) => false)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([[0, 1, 2, 3, 4, 5]]);
  });
  test("infinite chunks", () => {
    const seq = compose(
      // range(0, 50)
      count(0),
      chunk<number>((_a, b) => b % 10 === 0),
      // each<number>(chunk => console.log("chunk", chunk)),
      takeWhile<Sequence<number>>((chunk: Sequence<number>) => {
        const i = peek()(chunk);
        return i !== null && i < 100;
      })
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toMatchSnapshot();
  });
  test("input is an empty sequence", () => {
    const seq = chunk<number>((_a, _b) => true)(empty());
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([]);
  });
});

describe("chunkBy", () => {
  test("multiples of 3 are alone in their own chunk", () => {
    const seq = compose(
      range(0, 9),
      chunkBy(i => i % 3 !== 0)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0],
      [1, 2],
      [3],
      [4, 5],
      [6],
      [7, 8],
      [9]
    ]);
  });
});

describe("nth", () => {
  test("get first item", () => {
    const seq = count(0)();
    expect(nth(0)(seq)).toEqual(0);
  });
  test("get second item", () => {
    const seq = count(0)();
    expect(nth(1)(seq)).toEqual(1);
  });
  test("get distant item", () => {
    const seq = count(0)();
    expect(nth(1000)(seq)).toEqual(1000);
  });
  test("get null if sequence is too short", () => {
    const seq = range(1, 5)();
    expect(nth(6)(seq)).toEqual(null);
  });
});

describe("reduce", () => {
  test("get sum", () => {
    const seq = range(0, 100)();
    const sum = reduce<number, number>((i, acc) => acc + i, 0)(seq);
    expect(sum).toEqual(5050);
  });
});

describe("groupBy", () => {
  test("get modulus groups", () => {
    const seq = range(0, 5)();
    const groups = groupBy<number, number>(i => i % 3)(seq);
    expect(groups).toEqual({ 0: [0, 3], 1: [1, 4], 2: [2, 5] });
  });
});

describe("indexBy", () => {
  test("get modulus indexes", () => {
    const seq = range(0, 5)();
    const groups = indexBy<number, number>(i => i % 3)(seq);
    expect(groups).toEqual({ 0: 3, 1: 4, 2: 5 });
  });
});

describe("slices", () => {
  test("gets slices with perfect sizes", () => {
    const seq = compose(
      range(0, 8),
      slices(3)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ]);
  });
  test("gets slices with a final incomplete slice", () => {
    const seq = compose(
      range(0, 10),
      slices(3)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10]
    ]);
  });
  test("gets slices from an infinite sequence", () => {
    const seq = compose(
      count(0),
      slices(3),
      take(4)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10, 11]
    ]);
  });
  test("gets slices from empty sequence", () => {
    const seq = compose(
      empty,
      slices(3)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([]);
  });
});

describe("conses", () => {
  test.only("gets conses", () => {
    const seq = compose(
      range(0, 5),
      conses(3)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5]
    ]);
  });
  test("gets conses from an infinite sequence", () => {
    const seq = compose(
      count(0),
      conses(3),
      take(4)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5]
    ]);
  });
  test("gets conses from empty sequence", () => {
    const seq = compose(
      empty,
      conses(3)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([]);
  });
});

describe("tail", () => {
  test("gets tail", () => {
    const seq = compose(
      range(0, 5),
      tail()
    )();
    expect(toArray(seq)).toEqual([1, 2, 3, 4, 5]);
  });
  test("gets tail of empty sequence", () => {
    const seq = compose(
      empty,
      tail()
    )();
    expect(toArray(seq)).toEqual([]);
  });
});
