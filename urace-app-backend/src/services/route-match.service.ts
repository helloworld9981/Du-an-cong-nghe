type Point = {
  latitude: number;
  longitude: number;
};

function getDistanceMeters(a: Point, b: Point): number {
  const R = 6371000;

  const toRad = (deg: number) =>
    deg * Math.PI / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(h),
      Math.sqrt(1 - h)
    )
  );
}

export function validateRouteMatch(
  contestRoute: any,
  actualPoints: Point[]
) {

  if (
    !contestRoute?.polyline?.length ||
    !actualPoints?.length
  ) {
    return {
      isMatched: false,
      matchPercent: 0,
      matchedCheckpoints: 0,
      totalCheckpoints:
        contestRoute?.checkpoints?.length || 0,
      missedCheckpoints: [],
    };
  }

  const tolerance =
    contestRoute.toleranceMeters || 50;

  const requiredMatchPercent =
    contestRoute.requiredMatchPercent || 80;

  const plannedPoints =
    contestRoute.polyline;

  const checkpoints =
    contestRoute.checkpoints || [];

  let matchedActualPoints = 0;

  for (const actualPoint of actualPoints) {

    const nearRoute =
      plannedPoints.some((routePoint: Point) => {

        return (
          getDistanceMeters(
            actualPoint,
            routePoint
          ) <= tolerance
        );
      });

    if (nearRoute) {
      matchedActualPoints++;
    }
  }

  const matchPercent =
    actualPoints.length > 0
      ? (
          matchedActualPoints /
          actualPoints.length
        ) * 100
      : 0;

  const missedCheckpoints: number[] = [];

  checkpoints.forEach(
    (checkpoint: Point, index: number) => {

      const passed =
        actualPoints.some((actualPoint) => {

          return (
            getDistanceMeters(
              actualPoint,
              checkpoint
            ) <= tolerance
          );
        });

      if (!passed) {
        missedCheckpoints.push(index);
      }
    }
  );

  return {
    isMatched:
      matchPercent >= requiredMatchPercent &&
      missedCheckpoints.length === 0,

    matchPercent:
      Number(matchPercent.toFixed(2)),

    matchedCheckpoints:
      checkpoints.length -
      missedCheckpoints.length,

    totalCheckpoints:
      checkpoints.length,

    missedCheckpoints,
  };
}