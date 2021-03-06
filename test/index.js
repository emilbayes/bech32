'use strict'
let tape = require('tape')
let fixtures = require('./fixtures')
let bech32 = require('../')

fixtures.bech32.valid.forEach((f) => {
  tape(`fromWords/toWords ${f.hex}`, (t) => {
    t.plan(2)

    let words = bech32.toWords(Buffer.from(f.hex, 'hex'))
    let bytes = Buffer.from(bech32.fromWords(f.words))
    t.same(words, f.words)
    t.same(bytes.toString('hex'), f.hex)
  })

  tape(`encode ${f.prefix} ${f.hex}`, (t) => {
    t.plan(1)
    t.strictEqual(bech32.encode(f.prefix, f.words, f.limit), f.string.toLowerCase())
  })

  tape(`decode ${f.string}`, (t) => {
    t.plan(2)

    var expected = {
      prefix: f.prefix.toLowerCase(),
      words: f.words
    }
    t.same(bech32.decodeUnsafe(f.string, f.limit), expected)
    t.same(bech32.decode(f.string, f.limit), expected)
  })

  tape(`fails for ${f.string} with 1 bit flipped`, (t) => {
    t.plan(2)

    let buffer = Buffer.from(f.string, 'utf8')
    buffer[f.string.lastIndexOf('1') + 1] ^= 0x1 // flip a bit, after the prefix
    let string = buffer.toString('utf8')
    t.equal(bech32.decodeUnsafe(string, f.limit), undefined)
    t.throws(function () {
      bech32.decode(string, f.limit)
    }, new RegExp('Invalid checksum|Unknown character'))
  })
})

fixtures.bech32.invalid.forEach((f) => {
  if (f.prefix !== undefined && f.words !== undefined) {
    tape(`encode fails with (${f.exception})`, (t) => {
      t.plan(1)

      t.throws(function () {
        bech32.encode(f.prefix, f.words)
      }, new RegExp(f.exception))
    })
  }

  if (f.string !== undefined || f.stringHex) {
    let string = f.string || Buffer.from(f.stringHex, 'hex').toString('binary')

    tape(`decode fails for ${string} (${f.exception})`, (t) => {
      t.plan(2)
      t.equal(bech32.decodeUnsafe(string), undefined)
      t.throws(function () {
        bech32.decode(string)
      }, new RegExp(f.exception))
    })
  }
})

fixtures.fromWords.invalid.forEach((f) => {
  tape(`fromWords fails with ${f.exception}`, (t) => {
    t.plan(2)
    t.equal(bech32.fromWordsUnsafe(f.words), undefined)
    t.throws(function () {
      bech32.fromWords(f.words)
    }, new RegExp(f.exception))
  })
})

tape(`toWords/toWordsUnsafe accept bytes as ArrayLike<number>`, (t) => {
  // Ensures that only the two operations from
  //   interface ArrayLike<T> {
  //     readonly length: number;
  //     readonly [n: number]: T;
  //   }
  // are used, which are common for the typical binary types Uint8Array, Buffer and
  // Array<number>.

  const bytes = {
    length: 5,
    0: 0x00,
    1: 0x11,
    2: 0x22,
    3: 0x33,
    4: 0xff
  }
  const words1 = bech32.toWords(bytes)
  const words2 = bech32.toWordsUnsafe(bytes)
  t.plan(2)
  t.same(words1, [0, 0, 8, 18, 4, 12, 31, 31])
  t.same(words2, [0, 0, 8, 18, 4, 12, 31, 31])
})
