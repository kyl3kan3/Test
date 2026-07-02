import { PHOTO_JPEG_QUALITY, PHOTO_MAX_DIMENSION } from "@dtt/shared/limits";

/**
 * Compress a picked photo to ~1568px JPEG and return base64 — small enough
 * for the API's 3MB base64 cap and cheap for vision token costs.
 */
export async function prepareImage(uri: string, width: number, height: number) {
  const { ImageManipulator, SaveFormat } = await import("expo-image-manipulator");
  const longest = Math.max(width || 0, height || 0);
  const scale =
    longest > PHOTO_MAX_DIMENSION ? PHOTO_MAX_DIMENSION / longest : 1;

  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) {
    context.resize({
      width: Math.round((width || PHOTO_MAX_DIMENSION) * scale),
    });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: PHOTO_JPEG_QUALITY,
    base64: true,
  });
  return { base64: result.base64 ?? "", uri: result.uri };
}
