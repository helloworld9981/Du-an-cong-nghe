/**
 * Encodes an array of coordinates into a Google Polyline string.
 *
 * @param coordinates Array of { latitude, longitude } objects
 * @returns Encoded polyline string
 */
export const encodePolyline = (
  coordinates: { latitude: number; longitude: number }[],
): string => {
  if (!coordinates.length) {
    return "";
  }

  const factor = 1e5;
  let output = "";
  let lastLat = 0;
  let lastLng = 0;

  coordinates.forEach((point) => {
    const lat = Math.round(point.latitude * factor);
    const lng = Math.round(point.longitude * factor);

    let dLat = lat - lastLat;
    let dLng = lng - lastLng;

    lastLat = lat;
    lastLng = lng;

    [dLat, dLng].forEach((val) => {
      let num = val << 1;
      if (val < 0) {
        num = ~num;
      }
      while (num >= 0x20) {
        output += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
        num >>= 5;
      }
      output += String.fromCharCode(num + 63);
    });
  });

  return output;
};
