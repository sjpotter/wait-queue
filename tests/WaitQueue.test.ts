import * as assert from 'assert';
import WaitQueue from '../src/index';

describe('Methods of WaitQueue', function() {
  const wq = new WaitQueue();
  beforeEach(function() {
    // clear waitqueue
    wq.clear();
    wq.clearListeners();
  });
  it('length is equal to 10', function() {
    for (let n = 0; n < 10; n++) {
      wq.push(n);
    }
    assert.deepStrictEqual(10, wq.length);
  });
  it('set length will throw an error in strict mode', function() {
    assert.throws(function() {
      'use strict';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = wq;
      obj.length = 10;
    }, /Cannot set property/);
  });
  it('empty()', function() {
    wq.push(1);
    wq.empty();
    assert.deepStrictEqual([], Array.from(wq));
  });
  it('clearListeners() will send error to wait listeners', function(done) {
    const w = new WaitQueue();
    let num = 0;
    const handler = function(e: Error): void {
      assert.throws(function() {
        throw e;
      }, '/Clear Listeners');
      num++;
      if (num >= 2) {
        done();
      }
    };
    w.shift().catch(handler);
    w.pop().catch(handler);
    w.clearListeners();
  });
  it('push() should return queue length', function() {
    assert.strictEqual(1, wq.push(1));
  });
  it('push() should be sequence', function() {
    for (let n = 0; n < 5; n++) {
      wq.push(n);
    }
    assert.deepStrictEqual([0, 1, 2, 3, 4], Array.from(wq));
  });
  it('push() can receive multi args', function() {
    wq.push(0, 1, 2, 3, 4);
    assert.deepStrictEqual([0, 1, 2, 3, 4], Array.from(wq));
  });
  it('unshift() should return queue length', function() {
    assert.strictEqual(1, wq.unshift(1));
  });
  it('unshift() should be reverse', function() {
    for (let n = 0; n < 5; n++) {
      wq.unshift(n);
    }
    assert.deepStrictEqual([4, 3, 2, 1, 0], Array.from(wq));
  });
  it('unshift() can receive multi args', function() {
    wq.unshift(0, 1, 2, 3, 4);
    assert.deepStrictEqual([4, 3, 2, 1, 0], Array.from(wq));
  });
  it('shift() should return a promise', function() {
    wq.push(1);
    assert.ok(wq.shift() instanceof Promise);
  });
  it('pop() should return a promise', function() {
    wq.push(1);
    assert.ok(wq.pop() instanceof Promise);
  });

  it('shift() should wait while empty', async function() {
    const obj = { name: 'test' };
    setTimeout(() => {
      wq.push(obj);
    }, 100);

    const ret = await wq.shift();
    assert.equal(ret, obj);
    assert.equal(obj.name, 'test');
  });

  it('pop() should wait while empty', async function() {
    const obj = { name: 'test' };
    setTimeout(() => {
      wq.push(obj);
    }, 100);

    const ret = await wq.pop();
    assert.equal(ret, obj);
    assert.equal(obj.name, 'test');
  });

  it('multiple shifts are in correct order', async function() {
    wq.push(0, 1, 2, 3, 4);
    for(let i=0; i < 5; i++) {
      assert.strictEqual(await wq.shift(), i)
    }
  })

  it('multiple pops are in correct order', async function() {
    wq.push(0, 1, 2, 3, 4);
    for(let i=4; i >= 0; i--) {
      assert.strictEqual(await wq.pop(), i)
    }
  })

  it('pop(timeout) should error out', async function() {
    assert.rejects(wq.pop(1))
  });

  it('timed out listener, should try next listener', async function() {
    const p1 = wq.pop(1);
    const p2 = wq.pop();
    setTimeout(() => wq.push(1), 10);
    try {
      await p1;
      assert.strictEqual(true, false);
    } catch (err) {
      assert.deepStrictEqual(err, new Error("Timed Out"))
    }
    assert.strictEqual(await p2, 1);
  })

  it('count number of listeners', async function() {
    const p1 = wq.pop(1);
    const p2 = wq.pop();
    wq.pop().catch(() => {}); // this will be cleared, and hence failed;

    assert.strictEqual(wq.numListeners(), 3);
    setTimeout(() => assert.strictEqual(wq.numListeners(), 2), 10);
    setTimeout(() => wq.push(1), 20);
    assert.rejects(p1);
    assert.strictEqual(await p2, 1);
    assert.strictEqual(wq.numListeners(), 1)
    wq.clearListeners();
    assert.strictEqual(wq.numListeners(), 0);
  })

  it('Iterator for(... of ...)', function() {
    for (let n = 0; n < 5; n++) {
      wq.push(n);
    }
    const arr = [];
    for (const n of wq) {
      arr.push(n);
    }
    assert.deepStrictEqual([0, 1, 2, 3, 4], arr);
  });
});
