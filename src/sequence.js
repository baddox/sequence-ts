"use strict";
exports.__esModule = true;
// How do I get it to realize that `create` and `empty` are SequenceGenerators?
function create(item, next) {
    return function () { return ({ item: item, next: next, stop: false }); };
}
exports.create = create;
function empty() {
    return function () { return ({ stop: true }); };
}
exports.empty = empty;
function just(item) {
    return create(item, empty());
}
exports.just = just;
function chain(firstSequence, secondGenerator) {
    var step = firstSequence();
    switch (step.stop) {
        case true:
            return secondGenerator();
        case false:
            return create(step.item, chain(step.next, secondGenerator));
    }
}
exports.chain = chain;
// How would it not realize the types of these arguments, given that they're
// passed directly to `chain`?
function andThen(secondGenerator, firstSequence) {
    return chain(firstSequence, secondGenerator);
}
exports.andThen = andThen;
function reduce(reducer, initialAccumulator) {
    return function (sequence) {
        function helper(accumulator, seq) {
            var step = seq();
            switch (step.stop) {
                case true:
                    return accumulator;
                case false:
                    var newAccumulator = reducer(step.item, accumulator);
                    return helper(newAccumulator, step.next);
            }
        }
        return helper(initialAccumulator, sequence);
    };
}
exports.reduce = reduce;
function map(func) {
    return function (sequence) {
        var step = sequence();
        switch (step.stop) {
            case true:
                return empty();
            case false:
                return chain(just(func(step.item)), function () { return map(func)(step.next); });
        }
    };
}
exports.map = map;
function each(func) {
    return function (sequence) {
        map(func)(sequence);
    };
}
exports.each = each;
function takeWhile(predicate) {
    return function (sequence) {
        var step = sequence();
        switch (step.stop) {
            case true:
                return empty();
            case false:
                return predicate(step.item)
                    ? chain(just(step.item), function () { return takeWhile(predicate)(step.next); })
                    : empty();
        }
    };
}
exports.takeWhile = takeWhile;
function count(start) {
    return function () {
        var i = start;
        var loop = function () {
            var j = i;
            i += 1;
            return create(j, loop);
        };
        return loop;
    };
}
exports.count = count;
function range(start, stop) {
    return takeWhile(function (i) { return i <= stop; })(count(start));
}
exports.range = range;
function toArray(sequence) {
    return reduce(function (a, item) { return a.concat([item]); }, [])(sequence);
}
exports.toArray = toArray;
function compose() {
    var funcs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        funcs[_i] = arguments[_i];
    }
    return function (seq_) {
        var newArg = seq_;
        funcs.forEach(function (func) { return (newArg = func(newArg)); });
        return newArg;
    };
}
exports.compose = compose;
