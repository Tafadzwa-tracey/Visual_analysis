import {
  interpolateViridis,
  interpolatePuRd,
  interpolateYlOrRd,
  scaleLinear,
  scaleSequential,
  scaleOrdinal,
  extent,
  max
} from 'd3';
import { MapMarks } from './Marks';
import { AxisRight } from './AxisRight';
import { ColorBarMark } from './ColorBarMark';

export const MapColorMark = ({
  data,
  atlas,
  avgValue,
  topStates,
  colorValue,
  innerWidth,
  innerHeight,
  tooltipValue,
  tooltipFormat,
  setSelectedValue,
  selectedValue,
  setHoveredValue,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) => {
  const legendOffsetX = innerWidth * 2 + 50;
  const legendOffsetY = innerHeight;
  const yColorBarLabel = 'Avg Value';
  const barWidth = 30;
  const barHeight = 200;
  const barLineOffset = 0; //This offset is done on purpose because of the range

  console.log('Calling MapColorMark...');
  //console.log(extent(data, avgValue));
  //console.log(tooltipValue);
  //console.log(avgValue);
  const filteredData = data
    .filter(d => colorValue(d) !== 'Puerto Rico')
    .filter(d => colorValue(d) !== 'District of Columbia');

  const state2Value = new Map();
  filteredData.forEach(d => {
    state2Value.set(colorValue(d), avgValue(d));
  });
  const newExtent = extent(filteredData, avgValue);
  newExtent[0] = Math.floor(newExtent[0]);
  newExtent[1] = Math.ceil(newExtent[1]);

  const yScale = scaleLinear()
    .domain(newExtent)
    .range([0, barHeight]);

  //Note that schemeYlOrRd and interpolatePuRd are different
  //Use interpolateYlOrRd instead
  const mapColorScale = scaleSequential(interpolateYlOrRd)
    .domain(newExtent);
  
  const mapColorScale1 = scaleLinear()
    .domain(newExtent)
    .range(['white', 'blue']);

  const mapColorScale2 = scaleSequential()
    .domain(newExtent)
    .interpolator(interpolatePuRd);
  //   	.interpolator(interpolateViridis); //interpolatePuRd

  return (
    <>
      <MapMarks
        data={filteredData}
        dataMap={state2Value}
			  topStates={topStates}
        atlas={atlas}
        colorValue={avgValue}
        colorScale={mapColorScale}
        tooltipValue={avgValue}
        tooltipFormat={tooltipFormat}
        onClick={setSelectedValue}
        selectedValue={selectedValue}
        onHover={setHoveredValue}
        hoveredValue={hoveredValue}
        hoverOpacity={hoverOpacity}
        fadeOpacity={fadeOpacity}
      />
      <g transform={`translate(${legendOffsetX}, ${legendOffsetY})`}>
        <ColorBarMark
          dataSegment={66}
          dataExtent={newExtent}
          colorScale={mapColorScale}
          barWidth={barWidth}
          barHeight={barHeight}
          tooltipFormat={tooltipFormat}
        />
        <AxisRight yScale={yScale} tickOffset={barWidth + 40} />
        {(value => {
          const yLevel = state2Value.get(value);
          return yLevel ? (
            <line
              x1={0}
              y1={yScale(yLevel) - barLineOffset}
              x2={barWidth}
              y2={yScale(yLevel) - barLineOffset}
              stroke="cyan"
            />
          ) : null;
        })(hoveredValue)}
        {(value => {
          const yLevel = state2Value.get(value);
          return yLevel ? (
            <line
              x1={0}
              y1={yScale(yLevel) - barLineOffset}
              x2={barWidth}
              y2={yScale(yLevel) - barLineOffset}
              stroke="lightgreen"
              stroke-width={2}
            />
          ) : null;
        })(selectedValue)}
        <text className="axis-label" x={barWidth} y={-10} textAnchor="middle">
          {yColorBarLabel}
        </text>
      </g>
    </>
  );
};
