export const AxisRight = ({ yScale, tickOffset }) =>
  yScale.ticks().map(tickValue => (
    <g className="tick" transform={`translate(0,${yScale(tickValue)})`}>
      <text
        key={tickValue}
        style={{ textAnchor: 'end' }}
        x={tickOffset}
        dy=".22em"
      >
        {tickValue}
      </text>
    </g>
  ));
