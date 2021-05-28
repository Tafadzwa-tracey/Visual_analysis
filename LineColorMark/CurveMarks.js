import { line, curveNatural, curveCardinal } from 'd3';

export const CurveMarks = ({
  data,
  xScale,
  yScale,
  xValue,
  yValue,
  clrScale,
  clrValue,
  tooltipFormat,
  circleRadius,
  onClick,
  selectedValue,
  onHover,
  hoveredValue,
  fadeOpacity,
  hoverOpacity
}) => {
  //Group used to be Year, can also be State
  const groups = data.map(d => clrValue(d));
  const distinctGroups = [...new Set(groups)];
  const groupData = yId => data.filter(d => clrValue(d) === yId);
//  console.log(distinctGroups.filter(d=>d===hoveredValue), distinctGroups.filter(d=>d===selectedValue));
  const highlightSelection = yId =>
    yId === hoveredValue ? '1.8' : yId === selectedValue ? '1.5' : '1';
  return (
    <g className="line1">
      {distinctGroups.map(yId => {
        return (
          <path
            onClick={() => {
              onClick(yId);
            }}
            onMouseEnter={() => {
              onHover(yId);
            }}
            onMouseOut={() => {
              onHover(null);
            }}
            opacity={
              yId === selectedValue || yId === hoveredValue
                ? hoverOpacity
                : fadeOpacity
            }
            fill="none"
            stroke={clrScale(yId)}
            stroke-width={highlightSelection(yId)}
            d={line()
              .x(d => xScale(xValue(d)))
              .y(d => yScale(yValue(d)))
              .curve(curveCardinal.tension(1.0))(groupData(yId))}
          >
            <title>{yId}</title>
          </path>
        );
      })}
    </g>
  );
};
