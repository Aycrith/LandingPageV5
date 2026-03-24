import fs from "node:fs";
import path from "node:path";

const glbPath = path.resolve(
  process.cwd(),
  "public/models/paradox_abstract_art_of_python.glb"
);
const EXTENSION_NAME = "KHR_materials_pbrSpecularGlossiness";

function padTo4(buffer) {
  const pad = (4 - (buffer.length % 4)) % 4;
  if (pad === 0) return buffer;
  return Buffer.concat([buffer, Buffer.from(" ".repeat(pad))]);
}

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  const magic = buffer.toString("utf8", 0, 4);
  if (magic !== "glTF") {
    throw new Error(`Expected GLB magic header, got ${magic}`);
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version ${version}`);
  }

  let offset = 12;
  const chunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString("utf8", offset + 4, offset + 8);
    offset += 8;
    const data = buffer.subarray(offset, offset + length);
    offset += length;
    chunks.push({ type, data });
  }

  return chunks;
}

function convertMaterial(material) {
  const extension = material.extensions?.[EXTENSION_NAME];
  if (!extension) return material;

  const diffuseFactor = extension.diffuseFactor ?? [1, 1, 1, 1];
  const specularFactor = extension.specularFactor ?? [0.04, 0.04, 0.04];
  const glossinessFactor = extension.glossinessFactor ?? 1;
  const strongestSpecular = Math.max(...specularFactor);

  material.pbrMetallicRoughness = {
    baseColorFactor: diffuseFactor,
    metallicFactor: Number((strongestSpecular * 0.25).toFixed(4)),
    roughnessFactor: Number((1 - glossinessFactor * 0.85).toFixed(4)),
  };

  if (material.extensions) {
    delete material.extensions[EXTENSION_NAME];
    if (Object.keys(material.extensions).length === 0) {
      delete material.extensions;
    }
  }

  return material;
}

function convertParadoxGlb(filePath) {
  const chunks = readGlb(filePath);
  const jsonChunk = chunks.find((chunk) => chunk.type === "JSON");
  if (!jsonChunk) throw new Error("Missing JSON chunk in GLB");

  const json = JSON.parse(jsonChunk.data.toString("utf8").trim());
  json.materials = (json.materials ?? []).map(convertMaterial);
  json.extensionsUsed = (json.extensionsUsed ?? []).filter(
    (name) => name !== EXTENSION_NAME
  );
  json.extensionsRequired = (json.extensionsRequired ?? []).filter(
    (name) => name !== EXTENSION_NAME
  );

  const updatedJson = padTo4(Buffer.from(JSON.stringify(json), "utf8"));
  const rebuiltChunks = chunks.map((chunk) => {
    const data = chunk.type === "JSON" ? updatedJson : chunk.data;
    const header = Buffer.alloc(8);
    header.writeUInt32LE(data.length, 0);
    header.write(chunk.type, 4, 4, "utf8");
    return Buffer.concat([header, data]);
  });

  const totalLength = 12 + rebuiltChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const header = Buffer.alloc(12);
  header.write("glTF", 0, 4, "utf8");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  fs.writeFileSync(filePath, Buffer.concat([header, ...rebuiltChunks]));
}

convertParadoxGlb(glbPath);
