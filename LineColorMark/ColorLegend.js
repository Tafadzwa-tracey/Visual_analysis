export const ColorLegend = ({
  colorScale,
  tickSpacing = 20,
  tickWidth = 16,
  tickHeight = 4,
  tickTextOffset = 20,
  onClick,
  selectedValue,
  onHover,
  hoveredValue,
  hoverOpacity,
  fadeOpacity
}) =>
  colorScale.domain().map((domainValue, i) => {
    const sizeExtra = 2;
    const highlightSelection = () => {
      if (domainValue === selectedValue)
        return (<rect
          fill={'darkred'}
          x={-(tickWidth+sizeExtra)/2}
          y={-(tickHeight+sizeExtra)/2}
          width={(tickWidth+sizeExtra)}
          height={(tickHeight+sizeExtra)}
        />);
    };
    const highlightSelectedFont = () => {
      if (domainValue === selectedValue) return { fontWeight: 'bold' };
    };
    return (
      <g
        className="tick"
        transform={`translate(0,${i * tickSpacing})`}
        onClick={() => {
          onClick(domainValue);
        }}
        onMouseEnter={() => {
          onHover(domainValue);
        }}
        onMouseOut={() => {
          onHover(null);
        }}
        opacity={
          domainValue === selectedValue || domainValue === hoveredValue
            ? hoverOpacity
            : fadeOpacity
        }
      >
        {highlightSelection()}
        <rect
          fill={colorScale(domainValue)}
          x={-tickWidth/2}
          y={-tickHeight/2}
          width={tickWidth}
          height={tickHeight}
        />
        <text x={tickTextOffset} dy=".32em" style={highlightSelectedFont()}>
          {domainValue}
        </text>
      </g>
    );
  });
