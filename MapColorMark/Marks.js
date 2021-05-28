import { geoAlbersUsa, geoAlbers, geoPath, geoGraticule } from 'd3';
import { useMemo } from 'react';

//const projection = geoAlbers();
const projection = geoAlbersUsa();
const pathProj = geoPath(projection);
const graticule = geoGraticule();

const missingDataColor = 'gray';

export const MapMarks = ({
  data,
  dataMap,
  topStates,
  atlas: { states, interiors },
  colorScale,
  colorValue,
  tooltipValue,
  tooltipFormat,
  onClick,
  selectedValue,
  onHover,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) => (
  <g className="marks">
    {useMemo(
      () => (
        <>
          <path className="sphere" d={pathProj({ type: 'Sphere' })} />
          <path className="graticules" d={pathProj(graticule())} />
          <path className="interiors" d={pathProj(interiors)} />
        </>
      ),
      [pathProj, graticule]
    )}
    {useMemo(
      () =>
        states.features.map(feature => {
          const yId = feature.properties.name;
          //console.log('featureName:', yId);
          const stateColor = obj => {
            return data
              .filter(d => d.State === obj.properties.name)
              .map(d => colorScale(colorValue(d)));
          };
          const isTop = value => topStates.filter(d => d.State === value);

          //Note: (keep)stateColor(feature) no longer used!
          const d = dataMap.get(feature.properties.name);
          if (!d) {
            //We know a few states are ignored in dataMap.
            //console.log(feature.properties.name);
          }
          //console.log(dataMap);
          return (
            <path
              className="land-state"
              d={pathProj(feature)}
              fill={d ? colorScale(d) : missingDataColor}
              stroke={
                yId === selectedValue || yId === hoveredValue
                  ? 'white'
                  : 'lightgrey'
              }
              stroke-width={
                yId === selectedValue || yId === hoveredValue ? 3 : 0
              }
              onClick={() => {
                if (isTop(yId).length) onClick(yId);
              }}
              onMouseEnter={() => {
                if (isTop(yId).length) onHover(yId);
              }}
              onMouseOut={() => {
                if (isTop(yId).length) onHover(null);
              }}
            >
              <title>{yId + ' : ' + tooltipFormat(dataMap.get(yId))}</title>
            </path>
          );
        }),
      [pathProj, states, dataMap]
    )}
  </g>
);
