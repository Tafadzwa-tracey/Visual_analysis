export const ColorBarMark = ({
  dataSegment = 8,
  dataExtent,
  colorScale,
  barWidth,
  barHeight,
  tooltipFormat
}) => {
  const getCenter = d =>
    ((d + 0.5) / dataSegment) * (dataExtent[1] - dataExtent[0]);

  const ColorBar = ({ data, elemOffset }) =>
    data.map(id => (
      <g className="bars">
        <rect
          className="colorBarElement"
          key={'barElement' + id}
          x={0}
          y={elemOffset * id}
          width={barWidth}
          height={Math.ceil(elemOffset) + 1}
          fill={colorScale(getCenter(id))}
        >
          <title>{tooltipFormat(getCenter(id))}</title>
        </rect>
      </g>
    ));

  const data = Array.from(Array(dataSegment).keys());
  return <ColorBar data={data} elemOffset={barHeight / dataSegment} />;
};
