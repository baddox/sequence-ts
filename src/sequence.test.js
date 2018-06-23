"use strict";
exports.__esModule = true;
var sequence_1 = require("./sequence");
test("count", function () {
    var seq = sequence_1.compose(sequence_1.takeWhile(function (i) { return i < 5; }))(sequence_1.count(0)());
    expect(sequence_1.toArray(seq)).toBe([0, 1, 2, 3, 4]);
});
test("basic again", function () {
    expect(4).toBe(3);
});
