export function readFileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image file could not be read"));
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export async function resizeImageDataUrl(
  file: File,
  {
    maxWidth,
    maxHeight,
    quality = 0.88,
  }: { maxWidth: number; maxHeight: number; quality?: number },
) {
  if (file.type.toLowerCase() === "image/gif") {
    return readFileDataUrl(file);
  }

  const source = await readFileDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  if (scale >= 1) return source;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type.toLowerCase() === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outputType, outputType === "image/jpeg" ? quality : undefined);
}

export function imageDimensions(dataUrl: string) {
  return loadImage(dataUrl).then((image) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  }));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image file could not be read"));
    image.src = src;
  });
}
