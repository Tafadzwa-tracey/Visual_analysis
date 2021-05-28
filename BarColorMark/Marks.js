export const BarMarks = ({
  data,
  xScale,
  yScale,
  xValue,
  yValue,
  clrScale,
  clrValue,
  tooltipFormat,
  topStates,
  onClick,
  selectedValue,
  onHover,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) => {
  const highlightSelection = d => {
    const domainValue = yValue(d); //state
    const bkBarColor =
      domainValue === selectedValue || domainValue === hoveredValue
        ? 'darkred'
        : 'white';
    return (
      <rect
        className="barMark"
        key={domainValue}
        x={0}
        y={yScale(domainValue) - 1}
        width={xScale(xValue(d)) + 1}
        height={yScale.bandwidth() + 2}
        fill={bkBarColor}
      />
    );
  };
  const highlightBars = data.map(d => {
    const domainValue = yValue(d); //state
    return (
      <g
        className="bars"
        opacity={
          domainValue === selectedValue || domainValue === hoveredValue
            ? hoverOpacity
            : hoverOpacity
        }
      >
        {highlightSelection(d)}
      </g>
    );
  });
  const normalBars = data.map(d => {
    const domainValue = yValue(d); //state
    return (
      <g
        className="bars"
        opacity={
          domainValue === selectedValue || domainValue === hoveredValue
            ? hoverOpacity
            : hoverOpacity
        }
      >
        <rect
          className="barMark"
          key={domainValue}
          x={0}
          y={yScale(domainValue)}
          width={xScale(xValue(d))}
          height={yScale.bandwidth()}
          fill={clrScale(clrValue(d))}
          onClick={() => {
            onClick(domainValue);
          }}
          onMouseEnter={() => {
            onHover(domainValue);
          }}
          onMouseOut={() => {
            onHover(null);
          }}
        >
          <title>{yValue(d) + ' : ' + tooltipFormat(xValue(d))}</title>
        </rect>
      </g>
    );
  });
  return (<>{highlightBars} {normalBars}</>);
};
