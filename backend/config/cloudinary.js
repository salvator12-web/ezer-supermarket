const crypto = require("crypto");

/**
 * Minimal Cloudinary integration using signed direct uploads.
 * No `cloudinary` npm SDK — a thin wrapper around Cloudinary's plain HTTP
 * API, signed with the same SHA-1 scheme the SDK uses under the hood.
 *
 * Flow:
 *   1. Client asks our server for a signature (POST /api/media/sign).
 *   2. Client uploads the file straight to Cloudinary using that signature
 *      (our server never touches the file bytes).
 *   3. Client saves the resulting secure_url on the product
 *      (PUT/POST /api/products, imageURL field).
 */

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Cloudinary's signing algorithm: take every param except `file`,
// `cloud_name`, `resource_type`, and `api_key`, sort keys alphabetically,
// join as `key=value` pairs with `&`, append the API secret, then SHA-1.
function signParams(params) {
  const apiSecret = getEnv("CLOUDINARY_API_SECRET");
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

// Builds everything a client needs to upload directly to Cloudinary: a
// timestamp + signature scoped to a fixed folder, plus the public config
// (api key / cloud name / upload URL). Never returns the API secret itself.
function createUploadSignature(folder = "ezer-products") {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signParams({ folder, timestamp });

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

// Deletes an asset from Cloudinary by public_id — used when a product's
// image is replaced or the product is removed, so files don't orphan.
async function destroyAsset(publicId, resourceType = "image") {
  const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary destroy failed (${res.status}): ${text}`);
  }
}

module.exports = { signParams, createUploadSignature, destroyAsset };
