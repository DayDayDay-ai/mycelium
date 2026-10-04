import { SphereGeometry, CylinderGeometry } from "three";
// Self-contained GLB 2.0 fixture: procedural cap and stem, no external resources.
export function testModel() {
  const parts = [],
    views = [],
    accessors = [],
    meshes = [];
  let offset = 0;
  function add(array, target) {
    const b = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const padded = Buffer.alloc(Math.ceil(b.length / 4) * 4);
    b.copy(padded);
    const index = views.length;
    views.push({ buffer: 0, byteOffset: offset, byteLength: b.length, target });
    parts.push(padded);
    offset += padded.length;
    return index;
  }
  for (const geometry of [
    new SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new CylinderGeometry(0.22, 0.32, 2, 24),
  ]) {
    const positions = geometry.attributes.position.array,
      normals = geometry.attributes.normal.array,
      indices = geometry.index.array;
    geometry.computeBoundingBox();
    const a = accessors.length;
    accessors.push({
      bufferView: add(positions, 34962),
      componentType: 5126,
      count: positions.length / 3,
      type: "VEC3",
      min: geometry.boundingBox.min.toArray(),
      max: geometry.boundingBox.max.toArray(),
    });
    accessors.push({
      bufferView: add(normals, 34962),
      componentType: 5126,
      count: normals.length / 3,
      type: "VEC3",
    });
    accessors.push({
      bufferView: add(indices, 34963),
      componentType: indices instanceof Uint16Array ? 5123 : 5125,
      count: indices.length,
      type: "SCALAR",
    });
    meshes.push({
      primitives: [
        {
          attributes: { POSITION: a, NORMAL: a + 1 },
          indices: a + 2,
          material: meshes.length,
        },
      ],
    });
  }
  const json = {
    asset: { version: "2.0", generator: "MYCELIUM verification fixture" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [{ mesh: 0, translation: [0, 1, 0] }, { mesh: 1 }],
    meshes,
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.7, 0.2, 0.1, 1],
          metallicFactor: 0,
          roughnessFactor: 0.6,
        },
        doubleSided: true,
      },
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.85, 0.8, 0.7, 1],
          metallicFactor: 0,
          roughnessFactor: 0.8,
        },
      },
    ],
    buffers: [{ byteLength: offset }],
    bufferViews: views,
    accessors,
  };
  const raw = Buffer.from(JSON.stringify(json)),
    chunk = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32);
  raw.copy(chunk);
  const bin = Buffer.concat(parts);
  const header = Buffer.alloc(12);
  header.write("glTF");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + chunk.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(chunk.length);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, chunk, binHeader, bin]);
}
