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
  length,
  empty,
  mapStep,
  fromArray,
  chain,
  just,
  createStep
} from "./sequence";

describe("each", () => {
  test("sum up some numbers", () => {
    const seq = fromArray([0, 1, 2, 3, 4, 5]);
    let sum = 0;
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
    let seq = compose(
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
    let seq = compose(
      range(0, 5),
      chunk<number>((_a, _b) => true)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([[0], [1], [2], [3], [4], [5]]);
  });
  test("every item is in the same chunk", () => {
    let seq = compose(
      range(0, 5),
      chunk<number>((_a, _b) => false)
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([[0, 1, 2, 3, 4, 5]]);
  });
  test("the 1st chunk has 1 item, 2nd chunk has 2 items, etc.", () => {
    let seq = compose(
      range(0, 9),
      chunk<number>(
        (_a, _b, chunkIndex, chunkLength) => chunkLength > chunkIndex
      )
    )();
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([
      // keep this formatting
      [0],
      [1, 2],
      [3, 4, 5],
      [6, 7, 8, 9]
    ]);
  });
  test("infinite chunks", () => {
    let seq = compose(
      // range(0, 50)
      count(0),
      chunk<number>(
        (_a, _b, chunkIndex, chunkLength) => chunkLength > chunkIndex
      ),
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
    let seq = chunk<number>((_a, _b) => true)(empty());
    const a = map((subSeq: Sequence<number>) => toArray(subSeq))(seq);
    expect(toArray(a)).toEqual([]);
  });
});

describe("chunkBy", () => {
  test("multiples of 3 are alone in their own chunk", () => {
    let seq = compose(
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
