import { scaleBand, scaleLinear, scaleOrdinal, max } from 'd3';
import { BarMarks } from './Marks';
import { AxisLeft } from './AxisLeft';
import { AxisBottom } from '../Common/AxisBottom';

const xAxisLabelOffset = 30;
const yAxisLabelOffset = 50;

export const BarColorMark = ({
  data,
  xValue,
  yValue,
  colorValue,
  topStates,
  groupColorDefs,
  innerWidth,
  innerHeight,
  xAxisLabel,
  xAxisTickFormat,
  setSelectedValue,
  selectedValue,
  setHoveredValue,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) => {
  console.log('Calling BarColorMark...');

  const yBarScale = scaleBand()
    .domain(data.map(yValue))
    .range([0, innerHeight])
    .paddingInner(0.15);

  //This is for max, we should do sth different!
  const xBarScale = scaleLinear()
    .domain([0, max(data, xValue)])
    .range([0, innerWidth]);

  const colorScale = scaleOrdinal()
    .domain(data.map(colorValue))
    .range(groupColorDefs);

  return (
    <>
      <rect width={innerWidth} height={innerHeight} fill="white" />
      <AxisBottom
        xScale={xBarScale}
        innerHeight={innerHeight}
        tickFormat={xAxisTickFormat}
      />
      <AxisLeft yScale={yBarScale} />
      <text
        className="axis-label"
        x={innerWidth / 2}
        y={innerHeight + xAxisLabelOffset}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>
      <BarMarks
        data={data}
        xScale={xBarScale}
        yScale={yBarScale}
        xValue={xValue}
        yValue={yValue}
        clrScale={colorScale}
        clrValue={colorValue}
        tooltipFormat={xAxisTickFormat}
			  topStates={topStates}
        onClick={setSelectedValue}
        selectedValue={selectedValue}
        onHover={setHoveredValue}
        hoveredValue={hoveredValue}
        hoverOpacity={hoverOpacity}
        fadeOpacity={fadeOpacity}
      />
    </>
  );
};
