import { scaleLinear, scaleOrdinal, extent } from 'd3';
import { AxisLeft } from './AxisLeft';
import { AxisBottom } from '../Common/AxisBottom';
import { CurveMarks } from './CurveMarks';
import { ColorLegend } from './ColorLegend';

export const LineColorMark = ({
  data,
  xValue,
  yValue,
  sizeValue,
  colorValue,
  colorDomain,
  groupColorDefs,
  innerWidth,
  innerHeight,
  legendOnLeft,
  xAxisLabel,
  yAxisLabel,
  xAxisTickFormat,
  tooltipValue,
  setSelectedValue,
  selectedValue,
  setHoveredValue,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) => {
  const halfWidth = innerWidth;
  const halfHeight = innerHeight;
  const legendOffsetX = legendOnLeft ? -160 : halfWidth - 10;
  const legendOffsetY = legendOnLeft ? 30 : 15;
  const colorLegendLabel = legendOnLeft ? '' : 'Years';
  const xAxisLabelOffset = 30;
  const yAxisLabelOffset = legendOnLeft ? 45 : 50;

  console.log('Calling Line ColorMark...');

  const xScale = scaleLinear()
    .domain(extent(data, xValue))
    .range([0, halfWidth])
    .nice();

  const yScale = scaleLinear()
    .domain(extent(data, yValue))
    .range([halfHeight, 0]);

  // console.log(extent(data, xValue));
  // console.log(extent(data, yValue));
  // console.log(extent(data, colorValue));
  // console.log(extent(data, sizeValue));

  const sizeScale = scaleLinear()
    .domain(extent(data, sizeValue))
    .range([1.1, 8.8]);

  const colorNewDomain = colorDomain
    ? colorDomain.map(colorValue)
    : data.map(colorValue).reverse();
  //  colorNewDomain.reverse();
  //console.log(colorNewDomain);
  const colorScale = scaleOrdinal()
    .domain(colorNewDomain)
    .range(groupColorDefs);

  //console.log(colorScale.domain());
  //console.log(colorScale.range());

  return (
    <>
      <AxisBottom
        xScale={xScale}
        innerHeight={halfHeight}
        tickFormat={xAxisTickFormat}
        tickOffset={5}
      />
      <text
        className="axis-label"
        textAnchor="middle"
        transform={`translate(${-yAxisLabelOffset},${halfHeight /
          2}) rotate(-90)`}
      >
        {yAxisLabel}
      </text>
      <AxisLeft yScale={yScale} innerWidth={halfWidth} tickOffset={5} />
      <text
        className="axis-label"
        x={halfWidth / 2}
        y={halfHeight + xAxisLabelOffset}
        textAnchor="middle"
      >
        {xAxisLabel}
      </text>
      <g transform={`translate(${legendOffsetX}, ${legendOffsetY})`}>
        <text x={15} y={-15} className="axis-label" textAnchor="middle">
          {colorLegendLabel}
        </text>
        <ColorLegend
          tickSpacing={14}
          tickTextOffset={12}
          colorScale={colorScale}
          onClick={setSelectedValue}
          selectedValue={selectedValue}
          onHover={setHoveredValue}
          hoveredValue={hoveredValue}
          hoverOpacity={hoverOpacity}
          fadeOpacity={fadeOpacity}
        />
      </g>
      <CurveMarks
        data={data}
        xScale={xScale}
        yScale={yScale}
        xValue={xValue}
        yValue={yValue}
        clrScale={colorScale}
        clrValue={colorValue}
        sizeScale={sizeScale}
        circleRadius={sizeValue}
        tooltipFormat={xAxisTickFormat}
        ttpValue={tooltipValue}
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
