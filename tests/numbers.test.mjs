import test from 'node:test';
import assert from 'node:assert/strict';
import {generate, randomInt, validTicket} from '../public/numbers.mjs';
test('leading zeros, repeated digits and fixed positions survive generation', () => {
  assert.deepEqual(generate({group: '3', fixed: ['0','0','1','1','0','0']}), [{group: 3, number: '001100'}]);
  for (let i = 0; i < 100; i++) {
    const [ticket] = generate({fixed: ['0','','','7','','']});
    assert.ok(validTicket(ticket)); assert.equal(ticket.number[0], '0'); assert.equal(ticket.number[3], '7');
  }
});
test('bundle generates all five groups with exactly the same six digits', () => {
  const tickets = generate({bundle: true});
  assert.deepEqual(tickets.map(t => t.group), [1,2,3,4,5]);
  assert.equal(new Set(tickets.map(t => t.number)).size, 1);
  assert.ok(tickets.every(validTicket));
});
test('random generation rejects biased remainder values', () => {
  const values = [4294967295, 4294967290, 9];
  assert.equal(randomInt(10, {getRandomValues(array) { array[0] = values.shift(); }}), 9);
  assert.equal(values.length, 0);
});
test('invalid inputs and stored tickets are rejected', () => {
  assert.throws(() => generate({group: 6}));
  assert.throws(() => generate({fixed: ['12','','','','','']}));
  assert.equal(validTicket({group: 1, number: '<img>'}), false);
});
