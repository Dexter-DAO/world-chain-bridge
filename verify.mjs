// Offline reader for the two July 1, 2026 SP1 v6 root updates. Requires Node.js.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { bn254 } from './vendor/bn254.mjs';

const { Fp, Fp2, Fp12, Fr } = bn254.fields;
const { G1, G2 } = bn254;
const guestKey = 0x006b05a17a12ae3a1395c77268f446acd0b339767c9e722ca657d01cee8d0489n;
const recursionRoot = '002f850ee998974d6cc00e50cd0814b098c05bfade466d28573240d057f25352';
const keyHash = '4388a21c687fdd5f218d7e3d13190cac4c5355818d3605fd5fb811df468ee696';
const registry = '0000000000000000000000000000000000ae079eb8a274cd51c0f44a9e4d67d4';

const read = filename => readFileSync(new URL('./archive/' + filename, import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest();
const integer = bytes => BigInt('0x' + bytes.toString('hex'));
const word = (buffer, index) => buffer.subarray(index * 32, (index + 1) * 32);

function fieldElement(bytes) {
  assert.equal(bytes.length, 32, 'wrong field width');
  const n = integer(bytes);
  assert(n < Fp.ORDER, 'field encoding out of range');
  return n;
}

function fieldCoordinate(bytes, group) {
  if (group === G1) return fieldElement(bytes);
  return { c1: fieldElement(word(bytes, 0)), c0: fieldElement(word(bytes, 1)) };
}

function affine(group, x, y) {
  const point = group.Point.fromAffine({ x, y });
  point.assertValidity();
  assert(!point.is0(), 'unexpected point at infinity');
  return point;
}

function uncompressed(bytes, group) {
  const half = bytes.length / 2;
  return affine(group, fieldCoordinate(bytes.subarray(0, half), group),
    fieldCoordinate(bytes.subarray(half), group));
}

// gnark stores X and two high bits selecting the lexicographically smaller or
// larger Y. For Fp2, compare imaginary coefficients first.
function compressed(bytes, group) {
  const data = Buffer.from(bytes);
  const flag = data[0] >> 6;
  assert([2, 3].includes(flag), 'unexpected compressed point');
  data[0] &= 0x3f;
  const x = fieldCoordinate(data, group);
  const field = group === G1 ? Fp : Fp2;
  const y = field.sqrt(group.weierstrassEquation(x));
  const negative = field.neg(y);
  const larger = group === G1 ? y > negative :
    y.c1 > negative.c1 || (y.c1 === negative.c1 && y.c0 > negative.c0);
  return affine(group, x, larger === (flag === 3) ? y : negative);
}

function verificationKey() {
  const raw = read('sp1-v6.1.0-groth16.vk');
  assert.equal(hash(raw).toString('hex'), keyHash, 'SP1 verification key changed');
  assert.equal(raw.readUInt32BE(288), 6, 'wrong input-commitment count');
  const ic = [];
  for (let offset = 292; offset < 292 + 6 * 32; offset += 32) {
    ic.push(compressed(raw.subarray(offset, offset + 32), G1));
  }
  return {
    alpha: compressed(raw.subarray(0, 32), G1),
    beta: compressed(raw.subarray(64, 128), G2),
    gamma: compressed(raw.subarray(128, 192), G2),
    delta: compressed(raw.subarray(224, 288), G2),
    ic
  };
}

function verify(proof, values, vk, program = guestKey) {
  assert.equal(proof.length, 356, 'wrong SP1 envelope');
  assert.equal(values.length, 448, 'wrong July 1 public-value length');
  assert.equal(proof.subarray(0, 4).toString('hex'), keyHash.slice(0, 8), 'wrong selector');
  assert.equal(integer(proof.subarray(4, 36)), 0n, 'guest did not exit successfully');
  assert.equal(proof.subarray(36, 68).toString('hex'), recursionRoot, 'wrong recursion root');
  const digest = hash(values);
  digest[0] &= 0x1f;
  const inputs = [program, integer(digest), 0n, integer(proof.subarray(36, 68)),
    integer(proof.subarray(68, 100))];
  let linear = vk.ic[0];
  for (const [i, scalar] of inputs.entries()) {
    assert(scalar >= 0n && scalar < Fr.ORDER, 'public input out of range');
    if (scalar !== 0n) linear = linear.add(vk.ic[i + 1].multiplyUnsafe(scalar));
  }
  const a = uncompressed(proof.subarray(100, 164), G1);
  const b = uncompressed(proof.subarray(164, 292), G2);
  const c = uncompressed(proof.subarray(292, 356), G1);
  const product = bn254.pairingBatch([
    { g1: a.negate(), g2: b }, { g1: vk.alpha, g2: vk.beta },
    { g1: linear, g2: vk.gamma }, { g1: c, g2: vk.delta }
  ]);
  assert(Fp12.eql(product, Fp12.ONE), 'Groth16 pairing failed');
}

function checkpoint(values) {
  const words = Array.from({ length: 14 }, (_, i) => word(values, i));
  assert.equal(integer(words[0]), 32n);
  assert.equal(integer(words[9]), 288n);
  assert.equal(integer(words[10]), 1n);
  assert.equal(integer(words[11]), 15n, 'wrong World ID registry slot');
  assert.equal(words[13].toString('hex'), registry, 'wrong World ID registry');
  return {
    before: { head: integer(words[6]), header: words[5], committee: words[8] },
    after: { head: integer(words[4]), header: words[2], committee: words[7] },
    root: words[12].toString('hex')
  };
}

function follows(previous, update) {
  assert.deepEqual(previous, update.before, 'previous checkpoint mismatch');
  assert(update.after.head > previous.head, 'checkpoint did not advance');
}

function changed(bytes, position) {
  const copy = Buffer.from(bytes);
  copy[position] ^= 1;
  return copy;
}

const vk = verificationKey();
const packets = ['first', 'second'].map(name => ({
  name, proof: read(name + '-proof.bin'), values: read(name + '-public-values.bin')
}));
const records = [];
for (const { name, proof, values } of packets) {
  verify(proof, values, vk);
  const update = checkpoint(values);
  records.push(update);
  console.log(name + ': VALID ' + update.before.head + ' -> ' + update.after.head +
    ', World ID registry root 0x' + update.root);
  assert.throws(() => verify(changed(proof, 110), values, vk));
  assert.throws(() => verify(proof, changed(values, 12 * 32 + 31), vk), /pairing failed/);
  assert.throws(() => verify(proof, values, vk, guestKey + 1n), /pairing failed/);
}
// Replacing C with the other genuine proof's C keeps all three points valid.
// A pairing failure here cannot be explained by an invalid point encoding.
const substituted = Buffer.from(packets[0].proof);
packets[1].proof.copy(substituted, 292, 292, 356);
assert.throws(() => verify(substituted, packets[0].values, vk), /pairing failed/);
assert.throws(() => verify(packets[0].proof, packets[1].values, vk), /pairing failed/);
const seed = {
  head: 14670208n,
  header: Buffer.from('e688259877546b7fa5454a91d6fdff65d136e9b82248f122ec8c048e2bb90e16', 'hex'),
  committee: Buffer.from('73cc75b21e85f2a4f43acad5c64c3967a2296fa170b86b72906541ade8b61dd3', 'hex')
};
follows(seed, records[0]);
follows(records[0].after, records[1]);
assert.throws(() => follows(seed, records[1]), /checkpoint mismatch/);
assert.throws(() => follows(records[0].after, records[0]), /checkpoint mismatch/);
console.log('PASS: two pairings; bootstrap and both transitions match.');
console.log('REJECTED: changed proofs, valid C from the other proof, changed registry roots, wrong guest key, cross-paired packets, skipped and repeated updates.');
