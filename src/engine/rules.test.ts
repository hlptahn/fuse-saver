import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getChunkIndexFromZ,
  getChunkBounds,
  getRequiredChunkIndices,
  generateChunkWaypoints,
  computeTelemetry,
  CHUNK_LENGTH,
} from './rules';

test('getChunkIndexFromZ correctly calculates chunk indices', () => {
  assert.equal(getChunkIndexFromZ(0), 0);
  assert.equal(getChunkIndexFromZ(50), 0);
  assert.equal(getChunkIndexFromZ(120), 1);
  assert.equal(getChunkIndexFromZ(245), 2);
  assert.equal(getChunkIndexFromZ(-10), -1);
});

test('getChunkBounds returns accurate coordinate spans and cyclical sectors', () => {
  const bounds0 = getChunkBounds(0, CHUNK_LENGTH);
  assert.equal(bounds0.zStart, 0);
  assert.equal(bounds0.zEnd, CHUNK_LENGTH);
  assert.equal(bounds0.sectorType, 'micro_pcb');

  const bounds1 = getChunkBounds(1, CHUNK_LENGTH);
  assert.equal(bounds1.zStart, CHUNK_LENGTH);
  assert.equal(bounds1.zEnd, 2 * CHUNK_LENGTH);
  assert.equal(bounds1.sectorType, 'industrial_fuses');

  const bounds2 = getChunkBounds(2, CHUNK_LENGTH);
  assert.equal(bounds2.sectorType, 'busbar_trench');

  const bounds3 = getChunkBounds(3, CHUNK_LENGTH);
  assert.equal(bounds3.sectorType, 'transformer_substation');
});

test('getRequiredChunkIndices produces continuous chunk range around Z', () => {
  const indices = getRequiredChunkIndices(150, 3, 1, 100);
  // Current index for 150 at chunkLength 100 is 1. Behind 1 is 0, ahead 3 is 4. Range [0, 1, 2, 3, 4]
  assert.deepEqual(indices, [0, 1, 2, 3, 4]);

  const defaultIndices = getRequiredChunkIndices(150);
  // 150 / 120 = 1. Behind 2 -> -1, ahead 2 -> 3. Range [-1, 0, 1, 2, 3]
  assert.deepEqual(defaultIndices, [-1, 0, 1, 2, 3]);
});

test('generateChunkWaypoints generates consistent spline waypoints with smooth coords', () => {
  const waypoints = generateChunkWaypoints(0, CHUNK_LENGTH);
  assert.equal(waypoints.length, 4);
  assert.equal(waypoints[0].z, 0);
  assert.equal(waypoints[0].sector, 'micro_pcb');
  // Check that altitudes and x offsets are finite numbers
  for (const wp of waypoints) {
    assert.equal(Number.isFinite(wp.x), true);
    assert.equal(Number.isFinite(wp.y), true);
    assert.equal(Number.isFinite(wp.z), true);
    assert.equal(Number.isFinite(wp.roll), true);
    assert.ok(wp.speedMultiplier > 0);
  }
});

test('computeTelemetry returns valid realistic industrial electrical telemetry', () => {
  const tele = computeTelemetry(10, 1.0);
  assert.ok(tele.voltage > 410 && tele.voltage < 420, `Voltage was ${tele.voltage}`);
  assert.ok(tele.current > 1000 && tele.current < 1300, `Current was ${tele.current}`);
  assert.ok(tele.frequency > 49.9 && tele.frequency < 50.1, `Frequency was ${tele.frequency}`);
  assert.ok(tele.powerFactor >= 0.9 && tele.powerFactor <= 1.0, `PF was ${tele.powerFactor}`);
  assert.ok(tele.temperatureC > 30 && tele.temperatureC < 65, `Temp was ${tele.temperatureC}`);
  assert.equal(tele.activeFuses, 84);
});
