(function (React$1,d3,topojson,ReactDOM,ReactDropdown) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && ReactDOM.hasOwnProperty('default') ? ReactDOM['default'] : ReactDOM;
  ReactDropdown = ReactDropdown && ReactDropdown.hasOwnProperty('default') ? ReactDropdown['default'] : ReactDropdown;

  const ValueAttributes = [
    { value: 'ILI_Percent', label: 'Fertility rate' },
    { value: 'ILI_Total', label: 'Education' },
    { value: 'Providers', label: 'Policy' },
    { value: 'Pat_Total', label: 'Family' }
  ];

  const FieldAttributes = [
    { value: 'State', label: 'State' },
    { value: 'Year', label: 'Year' },
    { value: 'Week', label: 'Week of the Year' }
  ];

  const getLabel = (value, attributes) => {
    for (let i = 0; i < attributes.length; i++) {
      if (attributes[i].value === value) {
        return attributes[i].label;
      }
    }
  };

  const NumOfStates = [
    { value: '10', label: '10' },
    { value: '7', label: '7' },
    { value: '5', label: '5' },
    { value: '3', label: '3' }
  ];

  const Group5Color = [
    '#fc2357',
    '#fc23ac',
    '#db23fc',
    '#9323fc',
    '#23fb8d'
  ];

  const Group10Color = [
    '#fc2357',
    '#fc23ac',
    '#db23fc',
    '#9323fc',
    '#23fb8d',
    '#37aeb8',
    '#d95f02',
    '#66c60e',
    '#fb7a89'
  ];

  // Appearance customization to improve readability.

  const csvUrl = 'https://gist.githubusercontent.com/yuzhang21/afd1af3a28631a12dfd8eee37520309f/raw/ILINet02.csv';

  const useData = () => {
    const [data, setData] = React$1.useState(null);
    
    React$1.useEffect(() => {
      const row = d => {
        d.Year = +d.YEAR;
        d.Week = +d.WEEK;
        d.State = d.REGION; //Need a lut to id related to map
        d.ILI_Percent = +d['%UNWEIGHTED ILI'];
        d.ILI_Total = +d.ILITOTAL;
        d.Providers = +d['NUM OF PROVIDERS'];
        d.Pat_Total = +d['TOTAL PATIENTS'];
        return d;
      };
      d3.csv(csvUrl, row).then(setData);
    }, []);
    
    return data;
  };

  const jsonUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

  const getUsAtlas = () => {
    const [data, setData] = React$1.useState(null);

     React$1.useEffect(() => {
       d3.json(jsonUrl).then(topology => {
         const { states, nation } = topology.objects;
         console.log('Load map file...');
         //debugger();
         setData({
           states: topojson.feature(topology, states),
           interiors: topojson.mesh(topology, states, (a, b) => a !== b)
         });
       });
     }, []);

    return data;
  };

  //In this function, we accumulate all states data by weeks for different year
  //So it has two fields, and we can create a unique key from them
  const getSumData = (data, xValue) => {
    //  console.log("sumData data: ", data);
    //	console.log("sumData xValue: ", xValue);
    //  console.log(data[1]);

    const o = {};
    const result = data
    .reduce((r, e) => {
      const key = e.YEAR + '|' + e.WEEK;
      e.value = xValue(e);
      if (!o[key]) {
        o[key] = e;
        o[key].count = 0;
        r.push(o[key]);
      } else {
        if(e.value >= 0)
        {
        	o[key].value += xValue(e);
          o[key].count ++;
        }
      }
      return r;
    }, [])
    .map(d => {d.avg = d.value/d.count; return d;});
    //No need because of multiple variables
    //.sort((a, b) => descending(a.avg, b.avg));

  	//console.log(o)
  	//console.log(result)

    return result;
  };

  //This function returns the summary of the top 10 data for bar chart
  const getTopNStateData = (data, xValue, topStateNum=10) => {

    const stateCounts = {};
    const stateTotals = {};

    const stateTotalWeekly = data
      .filter(d => xValue(d) !== 'X')
  //    .filter(d => d['YEAR'] === '2018')
      .map(d => {
        d.value = xValue(d);
        if (d.value) {
          if (!stateTotals[d['REGION']]) {
            stateTotals[d['REGION']] = 0;
            stateCounts[d['REGION']] = 0;
          }
          stateTotals[d['REGION']] += d.value;
          stateCounts[d['REGION']]++;
        }
        return d;
      });
    // console.log(stateTotalWeekly);
    // console.log(stateTotals);
    // console.log(stateCounts);

    const topStates = {};

    const topData = data.filter(d => topStates[d['State']]);
  //  console.log(topData);

    const array1 = Object.values(stateTotals);
    const array2 = Object.values(stateCounts);
    const array3 = Object.keys(stateTotals).map((state, i) => {
      return { state: state,
         total: array1[i],
         count: array2[i],
         avg: array1[i]/array2[i] };
    });

  //  console.log(array3);

    const array4 = array3
      .sort((a, b) => d3.descending(a.avg, b.avg))
      .slice(0, topStateNum);
    
    array4.forEach(d => (topStates[d.state] = true));

    //top 10 States filled!
    // console.log(topStates);
    // console.log(array4);

    const top10BarData = array4
      .map((d) => ({ State: d.state, Tvalue: d.avg }));
    return top10BarData;
  };

  const getFilteredData = (data, yearId) => {
    return data
      .filter(d => yearId !== null ? d['Year'] === yearId : d)
      .filter(d => d.State !== 'Florida')
      .filter(d => d.State !== 'Puerto Rico')
      .filter(d => d.State !== 'Virgin Islands')
      .filter(d => d.State !== 'District of Columbia')
      .filter(d => d.State !== 'Commonwealth of the Northern Mariana Islands');
  };

  const getState2ValueMap = (data, stateToValue) => {
    const state2Value = new Map();
    
    data.forEach(d => {
      state2Value.set(d.State, stateToValue(d));
    });
    return state2Value;
  };

  const getTopNStatesFlag = (data, topNStatesData) => {
    const top10States = {};
    
    topNStatesData.forEach(d => (top10States[d.State] = true));
    const top10Data = data.filter(d => top10States[d['State']]);
    return top10Data;
  };

  //In this function, we accumulate all week data by state for different year
  //So it has two fields, and we can create a unique key from them
  const getSumData2 = (data, xValue, yValue) => {
    //  console.log("sumData data: ", data);
    //	console.log("sumData xValue: ", xValue);
    //  console.log(data[1]);

    const o = {};
    const result = data
    .reduce((r, e) => {
      const key = e.YEAR + '|' + yValue(e);
      e.value = xValue(e);
      if (!o[key]) {
        o[key] = e;
        o[key].count = 0;
        r.push(o[key]);
      } else {
        if(e.value >= 0)
        {
        	o[key].value += xValue(e);
          o[key].count ++;
        }
      }
      return r;
    }, [])
    .map(d => {d.avg = d.value/d.count; return d;});
    //No need because of multiple variables
    //.sort((a, b) => descending(a.avg, b.avg));

  	//console.log(o)
  	//console.log(result)

    return result;
  };

  const getSumDataAll = (data, xValue, yValue) => {
    //  console.log("sumData data: ", data);
    //	console.log("sumData xValue: ", xValue);
    //  console.log(data[1]);

    const o = {};
    const result = data
    .reduce((r, e) => {
      const key = yValue(e);
      e.value = xValue(e);
      if (!o[key]) {
        o[key] = e;
        o[key].count = 0;
        r.push(o[key]);
      } else {
        if(e.value >= 0)
        {
        	o[key].value += xValue(e);
          o[key].count ++;
        }
      }
      return r;
    }, [])
    .map(d => {d.avg = d.value/d.count; return d;})
    .sort((a, b) => d3.descending(a.avg, b.avg));

  	//console.log(o)
  	//console.log(result)

    return result;
  };

  const BarMarks = ({
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
        React.createElement( 'rect', {
          className: "barMark", key: domainValue, x: 0, y: yScale(domainValue) - 1, width: xScale(xValue(d)) + 1, height: yScale.bandwidth() + 2, fill: bkBarColor })
      );
    };
    const highlightBars = data.map(d => {
      const domainValue = yValue(d); //state
      return (
        React.createElement( 'g', {
          className: "bars", opacity: domainValue === selectedValue || domainValue === hoveredValue
              ? hoverOpacity
              : hoverOpacity },
          highlightSelection(d)
        )
      );
    });
    const normalBars = data.map(d => {
      const domainValue = yValue(d); //state
      return (
        React.createElement( 'g', {
          className: "bars", opacity: domainValue === selectedValue || domainValue === hoveredValue
              ? hoverOpacity
              : hoverOpacity },
          React.createElement( 'rect', {
            className: "barMark", key: domainValue, x: 0, y: yScale(domainValue), width: xScale(xValue(d)), height: yScale.bandwidth(), fill: clrScale(clrValue(d)), onClick: () => {
              onClick(domainValue);
            }, onMouseEnter: () => {
              onHover(domainValue);
            }, onMouseOut: () => {
              onHover(null);
            } },
            React.createElement( 'title', null, yValue(d) + ' : ' + tooltipFormat(xValue(d)) )
          )
        )
      );
    });
    return (React.createElement( React.Fragment, null, highlightBars, " ", normalBars ));
  };

  const AxisLeft = ({ yScale, tickOffset = 3 }) =>
    yScale.domain().map(tickValue => (
      React.createElement( 'g', { className: "tick" },
        React.createElement( 'text', {
          key: tickValue, style: { textAnchor: 'end' }, x: -tickOffset, dy: ".32em", y: yScale(tickValue) + yScale.bandwidth() / 2 },
          tickValue
        )
      )
    ));

  const AxisBottom = ({
    xScale,
    innerHeight,
    tickFormat,
    tickOffset = 3
  }) =>
    xScale.ticks().filter(tick => Number.isInteger(tick)).map(tickValue => (
      React.createElement( 'g', {
        className: "tick", key: tickValue, transform: `translate(${xScale(tickValue)},0)` },
        React.createElement( 'line', { y2: innerHeight }),
        React.createElement( 'text', {
          style: { textAnchor: 'middle' }, dy: ".71em", y: innerHeight + tickOffset },
          tickFormat(tickValue)
        )
      )
    ));

  const xAxisLabelOffset = 30;

  const BarColorMark = ({
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

    const yBarScale = d3.scaleBand()
      .domain(data.map(yValue))
      .range([0, innerHeight])
      .paddingInner(0.15);

    //This is for max, we should do sth different!
    const xBarScale = d3.scaleLinear()
      .domain([0, d3.max(data, xValue)])
      .range([0, innerWidth]);

    const colorScale = d3.scaleOrdinal()
      .domain(data.map(colorValue))
      .range(groupColorDefs);

    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'rect', { width: innerWidth, height: innerHeight, fill: "white" }),
        React.createElement( AxisBottom, {
          xScale: xBarScale, innerHeight: innerHeight, tickFormat: xAxisTickFormat }),
        React.createElement( AxisLeft, { yScale: yBarScale }),
        React.createElement( 'text', {
          className: "axis-label", x: innerWidth / 2, y: innerHeight + xAxisLabelOffset, textAnchor: "middle" },
          xAxisLabel
        ),
        React.createElement( BarMarks, {
          data: data, xScale: xBarScale, yScale: yBarScale, xValue: xValue, yValue: yValue, clrScale: colorScale, clrValue: colorValue, tooltipFormat: xAxisTickFormat, topStates: topStates, onClick: setSelectedValue, selectedValue: selectedValue, onHover: setHoveredValue, hoveredValue: hoveredValue, hoverOpacity: hoverOpacity, fadeOpacity: fadeOpacity })
      )
    );
  };

  //const projection = geoAlbers();
  const projection = d3.geoAlbersUsa();
  const pathProj = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  const missingDataColor = 'gray';

  const MapMarks = ({
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
    React.createElement( 'g', { className: "marks" },
      React$1.useMemo(
        () => (
          React.createElement( React.Fragment, null,
            React.createElement( 'path', { className: "sphere", d: pathProj({ type: 'Sphere' }) }),
            React.createElement( 'path', { className: "graticules", d: pathProj(graticule()) }),
            React.createElement( 'path', { className: "interiors", d: pathProj(interiors) })
          )
        ),
        [pathProj, graticule]
      ),
      React$1.useMemo(
        () =>
          states.features.map(feature => {
            const yId = feature.properties.name;
            const isTop = value => topStates.filter(d => d.State === value);

            //Note: (keep)stateColor(feature) no longer used!
            const d = dataMap.get(feature.properties.name);
            //console.log(dataMap);
            return (
              React.createElement( 'path', {
                className: "land-state", d: pathProj(feature), fill: d ? colorScale(d) : missingDataColor, stroke: yId === selectedValue || yId === hoveredValue
                    ? 'white'
                    : 'lightgrey', 'stroke-width': yId === selectedValue || yId === hoveredValue ? 3 : 0, onClick: () => {
                  if (isTop(yId).length) { onClick(yId); }
                }, onMouseEnter: () => {
                  if (isTop(yId).length) { onHover(yId); }
                }, onMouseOut: () => {
                  if (isTop(yId).length) { onHover(null); }
                } },
                React.createElement( 'title', null, yId + ' : ' + tooltipFormat(dataMap.get(yId)) )
              )
            );
          }),
        [pathProj, states, dataMap]
      )
    )
  );

  const AxisRight = ({ yScale, tickOffset }) =>
    yScale.ticks().map(tickValue => (
      React.createElement( 'g', { className: "tick", transform: `translate(0,${yScale(tickValue)})` },
        React.createElement( 'text', {
          key: tickValue, style: { textAnchor: 'end' }, x: tickOffset, dy: ".22em" },
          tickValue
        )
      )
    ));

  const ColorBarMark = ({
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
        React.createElement( 'g', { className: "bars" },
          React.createElement( 'rect', {
            className: "colorBarElement", key: 'barElement' + id, x: 0, y: elemOffset * id, width: barWidth, height: Math.ceil(elemOffset) + 1, fill: colorScale(getCenter(id)) },
            React.createElement( 'title', null, tooltipFormat(getCenter(id)) )
          )
        )
      ));

    const data = Array.from(Array(dataSegment).keys());
    return React.createElement( ColorBar, { data: data, elemOffset: barHeight / dataSegment });
  };

  const MapColorMark = ({
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
    const newExtent = d3.extent(filteredData, avgValue);
    newExtent[0] = Math.floor(newExtent[0]);
    newExtent[1] = Math.ceil(newExtent[1]);

    const yScale = d3.scaleLinear()
      .domain(newExtent)
      .range([0, barHeight]);

    //Note that schemeYlOrRd and interpolatePuRd are different
    //Use interpolateYlOrRd instead
    const mapColorScale = d3.scaleSequential(d3.interpolatePuBuGn)
      .domain(newExtent);
    
    const mapColorScale1 = d3.scaleLinear()
      .domain(newExtent)
      .range(['white', 'blue']);

    const mapColorScale2 = d3.scaleSequential()
      .domain(newExtent)
      .interpolator(d3.interpolatePuRd);
    //   	.interpolator(interpolateViridis); //interpolatePuRd

    return (
      React.createElement( React.Fragment, null,
        React.createElement( MapMarks, {
          data: filteredData, dataMap: state2Value, topStates: topStates, atlas: atlas, colorValue: avgValue, colorScale: mapColorScale, tooltipValue: avgValue, tooltipFormat: tooltipFormat, onClick: setSelectedValue, selectedValue: selectedValue, onHover: setHoveredValue, hoveredValue: hoveredValue, hoverOpacity: hoverOpacity, fadeOpacity: fadeOpacity }),
        React.createElement( 'g', { transform: `translate(${legendOffsetX}, ${legendOffsetY})` },
          React.createElement( ColorBarMark, {
            dataSegment: 66, dataExtent: newExtent, colorScale: mapColorScale, barWidth: barWidth, barHeight: barHeight, tooltipFormat: tooltipFormat }),
          React.createElement( AxisRight, { yScale: yScale, tickOffset: barWidth + 40 }),
          (value => {
            const yLevel = state2Value.get(value);
            return yLevel ? (
              React.createElement( 'line', {
                x1: 0, y1: yScale(yLevel) - barLineOffset, x2: barWidth, y2: yScale(yLevel) - barLineOffset, stroke: "cyan" })
            ) : null;
          })(hoveredValue),
          (value => {
            const yLevel = state2Value.get(value);
            return yLevel ? (
              React.createElement( 'line', {
                x1: 0, y1: yScale(yLevel) - barLineOffset, x2: barWidth, y2: yScale(yLevel) - barLineOffset, stroke: "lightgreen", 'stroke-width': 2 })
            ) : null;
          })(selectedValue),
          React.createElement( 'text', { className: "axis-label", x: barWidth, y: -10, textAnchor: "middle" },
            yColorBarLabel
          )
        )
      )
    );
  };

  const AxisLeft$1 = ({ yScale, innerWidth, tickOffset = 3 }) =>
    yScale.ticks().map(tickValue => (
      React.createElement( 'g', { className: "tick", transform: `translate(0,${yScale(tickValue)})` },
        React.createElement( 'line', { x2: innerWidth }),
        React.createElement( 'text', {
          key: tickValue, style: { textAnchor: 'end' }, x: -tickOffset, dy: ".22em" },
          tickValue
        )
      )
    ));

  const CurveMarks = ({
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
      React.createElement( 'g', { className: "line1" },
        distinctGroups.map(yId => {
          return (
            React.createElement( 'path', {
              onClick: () => {
                onClick(yId);
              }, onMouseEnter: () => {
                onHover(yId);
              }, onMouseOut: () => {
                onHover(null);
              }, opacity: yId === selectedValue || yId === hoveredValue
                  ? hoverOpacity
                  : fadeOpacity, fill: "none", stroke: clrScale(yId), 'stroke-width': highlightSelection(yId), d: d3.line()
                .x(d => xScale(xValue(d)))
                .y(d => yScale(yValue(d)))
                .curve(d3.curveCardinal.tension(1.0))(groupData(yId)) },
              React.createElement( 'title', null, yId )
            )
          );
        })
      )
    );
  };

  const ColorLegend = ({
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
          { return (React.createElement( 'rect', {
            fill: 'darkred', x: -(tickWidth+sizeExtra)/2, y: -(tickHeight+sizeExtra)/2, width: (tickWidth+sizeExtra), height: (tickHeight+sizeExtra) })); }
      };
      const highlightSelectedFont = () => {
        if (domainValue === selectedValue) { return { fontWeight: 'bold' }; }
      };
      return (
        React.createElement( 'g', {
          className: "tick", transform: `translate(0,${i * tickSpacing})`, onClick: () => {
            onClick(domainValue);
          }, onMouseEnter: () => {
            onHover(domainValue);
          }, onMouseOut: () => {
            onHover(null);
          }, opacity: domainValue === selectedValue || domainValue === hoveredValue
              ? hoverOpacity
              : fadeOpacity },
          highlightSelection(),
          React.createElement( 'rect', {
            fill: colorScale(domainValue), x: -tickWidth/2, y: -tickHeight/2, width: tickWidth, height: tickHeight }),
          React.createElement( 'text', { x: tickTextOffset, dy: ".32em", style: highlightSelectedFont() },
            domainValue
          )
        )
      );
    });

  const LineColorMark = ({
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

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, xValue))
      .range([0, halfWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, yValue))
      .range([halfHeight, 0]);

    // console.log(extent(data, xValue));
    // console.log(extent(data, yValue));
    // console.log(extent(data, colorValue));
    // console.log(extent(data, sizeValue));

    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(data, sizeValue))
      .range([1.1, 8.8]);

    const colorNewDomain = colorDomain
      ? colorDomain.map(colorValue)
      : data.map(colorValue).reverse();
    //  colorNewDomain.reverse();
    //console.log(colorNewDomain);
    const colorScale = d3.scaleOrdinal()
      .domain(colorNewDomain)
      .range(groupColorDefs);

    //console.log(colorScale.domain());
    //console.log(colorScale.range());

    return (
      React.createElement( React.Fragment, null,
        React.createElement( AxisBottom, {
          xScale: xScale, innerHeight: halfHeight, tickFormat: xAxisTickFormat, tickOffset: 5 }),
        React.createElement( 'text', {
          className: "axis-label", textAnchor: "middle", transform: `translate(${-yAxisLabelOffset},${halfHeight /
          2}) rotate(-90)` },
          yAxisLabel
        ),
        React.createElement( AxisLeft$1, { yScale: yScale, innerWidth: halfWidth, tickOffset: 5 }),
        React.createElement( 'text', {
          className: "axis-label", x: halfWidth / 2, y: halfHeight + xAxisLabelOffset, textAnchor: "middle" },
          xAxisLabel
        ),
        React.createElement( 'g', { transform: `translate(${legendOffsetX}, ${legendOffsetY})` },
          React.createElement( 'text', { x: 15, y: -15, className: "axis-label", textAnchor: "middle" },
            colorLegendLabel
          ),
          React.createElement( ColorLegend, {
            tickSpacing: 14, tickTextOffset: 12, colorScale: colorScale, onClick: setSelectedValue, selectedValue: selectedValue, onHover: setHoveredValue, hoveredValue: hoveredValue, hoverOpacity: hoverOpacity, fadeOpacity: fadeOpacity })
        ),
        React.createElement( CurveMarks, {
          data: data, xScale: xScale, yScale: yScale, xValue: xValue, yValue: yValue, clrScale: colorScale, clrValue: colorValue, sizeScale: sizeScale, circleRadius: sizeValue, tooltipFormat: xAxisTickFormat, ttpValue: tooltipValue, onClick: setSelectedValue, selectedValue: selectedValue, onHover: setHoveredValue, hoveredValue: hoveredValue, hoverOpacity: hoverOpacity, fadeOpacity: fadeOpacity })
      )
    );
  };

  //Part I: Global values
  const width = 960;
  const menuHeight = 60;
  const height = 500 - menuHeight;
  const margin = { top: 10, right: 30, bottom: 65, left: 90 };
  const innerHeight = height - margin.top - margin.bottom;
  const innerWidth = width - margin.left - margin.right;
  const halfWidth = (innerWidth - 20) / 2;
  const halfHeight = (innerHeight - 20) / 2;
  const halfMarginX = 30;
  const halfMarginY = 40;
  const leftMarginX = 140;
  //Interaction related
  const fadeOpacity = 0.2;
  const normalOpacity = 0.8;
  const highlightOpacity = 0.96;

  //Part II: Main functiond
  const App = () => {
    const [hoveredYearValue, setHoveredYearValue] = React$1.useState(null);
    const [hoveredStateValue, setHoveredStateValue] = React$1.useState(null);
    const [selectYearValue, setSelectedYearValue] = React$1.useState(null);
    const [selectStateValue, setSelectedStateValue] = React$1.useState(null);

    const handleResetButtonClick = e => {
      e.preventDefault();
      setSelectedYearValue(null);
      setSelectedStateValue(null);
      console.log('The reset button is clicked.');
    };

    //Step 0: Menu with attribute selections
    //xValue and yValues are defined here
    const initialXAttribute = 'Week';
    const [xAttribute, setXAttribute] = React$1.useState(initialXAttribute);
    const xValue = d => d[xAttribute];
    //  xLabel is fixed for X
    const xAxisLabel = getLabel(xAttribute, FieldAttributes);

    const initialYAttribute = 'ILI_Percent';
    const [yAttribute, setYAttribute] = React$1.useState(initialYAttribute);
    const yValue = d => d[yAttribute];
    const yAxisLabel = getLabel(yAttribute, ValueAttributes);

    const initialNumState = '10';
    const [topStateNum, setTopStateNum] = React$1.useState(initialNumState);

    //  const data = useData();
    const data = useData();
    const usAtlas = getUsAtlas();

    if (!data || !usAtlas) {
      return React$1__default.createElement( 'pre', null, "Loading..." );
    }
    console.log('Data loading is done.');

    const siFormat2 = d3.format('4d');
    //const siFormat1 = format('.2g');
    const siFormat = d3.format('.2s');
    const xAxisTickFormat = tickValue => siFormat(tickValue).replace('G', 'B');
    const xAxisTickFormatYear = tickValue =>
      siFormat2(tickValue).replace('G', 'B');

    //hoverOpacity value definitions
    const hoverOpacityYear =
      hoveredYearValue !== null ? highlightOpacity : normalOpacity;
    const fadeOrNormalOpacityYear =
      hoveredYearValue !== null ? fadeOpacity : normalOpacity;
    const hoverOpacityState =
      hoveredStateValue !== null ? highlightOpacity : normalOpacity;
    const fadeOrNormalOpacityState =
      hoveredStateValue !== null ? fadeOpacity : normalOpacity;

    //Step 1: Derived data from here for plot:4-1 Line chart
    //Move into LineColorMark
    const colorValue = d => d.Year;
    const sizeValue = d => d.ILI_Total;
    const tooltipValue = d => d.ILI_Total;
    const color2ndValue = d => d.State;

    //const sumDataByYear = useMemo(() => (getSumData(data, yValue)), [data, yValue]);
    const sumDataByYear = getSumData(data, yValue);
    //  console.log(sumDataByYear);
    //console.log('Called sumData by year.');

    //Step 2: US map for all states plot: 4-2
    const yearId = hoveredYearValue !== null ? hoveredYearValue : selectYearValue;
    //  console.log('------ Hover or selection year: ', yearId);

    const filteredDataAll = getFilteredData(data, null);
    const filteredData = getFilteredData(data, yearId);
    //  console.log(filteredData);
    const sumDataAllState = getSumDataAll(filteredData, yValue, color2ndValue);
    const stateToValue = d => d.avg;
    const state2ValueMap = getState2ValueMap(sumDataAllState, stateToValue);
    //  console.log(state2ValueMap);

    //Step 3: Derived data from here for plot: 4-3 Bar chart
    const topNStatesData = getTopNStateData(filteredData, yValue, topStateNum);
    //  console.log(topNStatesData);
    //console.log('Called getTopNStateData by year.');

    const yBarValue = d => d.State;
    const xBarValue = d => d.Tvalue;

    //Step 4: Derived line plot: 4-4 Curve chart
    const top10States = getTopNStatesFlag(filteredDataAll, topNStatesData);
    //  console.log(top10States);
    const sumData10State = getSumData2(top10States, yValue, color2ndValue);
    //  console.log(sumData10State);
    //console.log('Called getSumData2 by state.');

    //Step 5: Draw plots using svg, other controls: ReactDropdown
    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( 'div', { className: "menus-container" },
          React$1__default.createElement( 'span', { className: "dropdown-label" }, "Choose a data field:"),
          React$1__default.createElement( ReactDropdown, {
            options: ValueAttributes, value: yAttribute, onChange: ({ value }) => setYAttribute(value) }),
          React$1__default.createElement( 'span', { className: "dropdown-label" }, " "),
          React$1__default.createElement( 'button', { className: "button", onClick: handleResetButtonClick },
            ' ', "Reset", ' '
          ),
          React$1__default.createElement( 'span', { className: "dropdown-label" }, "Top N States:"),
          React$1__default.createElement( ReactDropdown, {
            options: NumOfStates, value: topStateNum, onChange: ({ value }) => setTopStateNum(value) })
        ),
        React$1__default.createElement( 'svg', { width: width, height: height },
          React$1__default.createElement( 'g', {
            transform: `translate(${margin.left + halfWidth + halfMarginX},${
            margin.top
          }) scale(0.995 0.995)` },
            React$1__default.createElement( 'svg', {
              width: halfWidth, height: halfHeight + 20, viewBox: `0 0 ${width} ${height + 60}`, zoomAndPan: 'zoomAndPan', zoom: d3.zoom().on('zoom', () => {
                g.attr('transform', event.transform);
              }) },
              React$1__default.createElement( MapColorMark, {
                data: sumDataAllState, atlas: usAtlas, avgValue: stateToValue, topStates: topNStatesData, colorValue: color2ndValue, innerWidth: halfWidth, innerHeight: halfHeight, tooltipValue: yBarValue, tooltipFormat: xAxisTickFormat, setSelectedValue: setSelectedStateValue, selectedValue: selectStateValue, setHoveredValue: setHoveredStateValue, hoveredValue: hoveredStateValue, hoverOpacity: '0.45', fadeOpacity: '1.0' })
            )
          ),
          React$1__default.createElement( 'g', {
            transform: `translate(${margin.left + 5},${margin.top +
            halfHeight +
            halfMarginY})` },
            React$1__default.createElement( BarColorMark, {
              data: topNStatesData, xValue: xBarValue, yValue: yBarValue, colorValue: color2ndValue, topStates: topNStatesData, groupColorDefs: Group10Color, innerWidth: halfWidth, innerHeight: halfHeight, xAxisLabel: yAxisLabel, xAxisTickFormat: xAxisTickFormat, setSelectedValue: setSelectedStateValue, selectedValue: selectStateValue, setHoveredValue: setHoveredStateValue, hoveredValue: hoveredStateValue, hoverOpacity: normalOpacity, fadeOpacity: fadeOrNormalOpacityState })
          ),
          React$1__default.createElement( 'g', { transform: `translate(${margin.left},${margin.top})` },
            React$1__default.createElement( LineColorMark, {
              data: sumDataByYear, xValue: xValue, yValue: yValue, sizeValue: sizeValue, colorValue: colorValue, groupColorDefs: Group5Color, innerWidth: halfWidth, innerHeight: halfHeight, xAxisLabel: xAxisLabel, yAxisLabel: yAxisLabel, xAxisTickFormat: xAxisTickFormatYear, tooltipValue: tooltipValue, setSelectedValue: setSelectedYearValue, selectedValue: selectYearValue, setHoveredValue: setHoveredYearValue, hoveredValue: hoveredYearValue, hoverOpacity: hoverOpacityYear, fadeOpacity: fadeOrNormalOpacityYear })
          ),
          React$1__default.createElement( 'g', {
            transform: `translate(${margin.left +
            2 +
            halfWidth +
            halfMarginX +
            leftMarginX},${margin.top + halfHeight + halfMarginY})` },
            React$1__default.createElement( LineColorMark, {
              data: sumData10State, xValue: colorValue, yValue: yValue, sizeValue: sizeValue, colorValue: color2ndValue, colorDomain: topNStatesData, groupColorDefs: Group10Color, innerWidth: halfWidth - leftMarginX, innerHeight: halfHeight, legendOnLeft: 'true', xAxisLabel: 'Year', yAxisLabel: yAxisLabel, xAxisTickFormat: xAxisTickFormatYear, tooltipValue: tooltipValue, setSelectedValue: setSelectedStateValue, selectedValue: selectStateValue, setHoveredValue: setHoveredStateValue, hoveredValue: hoveredStateValue, hoverOpacity: hoverOpacityState, fadeOpacity: fadeOrNormalOpacityState })
          )
        )
      )
    );
  };

  const rootElement = document.getElementById('root');
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React,d3,topojson,ReactDOM,ReactDropdown));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL0NvbW1vbi9BdHRyaWJ1dGVzRGVmcy5qcyIsIi4uL2NvbmZpZy5qcyIsIi4uL0RhdGEvdXNlRGF0YS5qcyIsIi4uL0RhdGEvZ2V0VXNBdGxhcy5qcyIsIi4uL0RhdGEvc3VtRGF0YUJ5WWVhci5qcyIsIi4uL0RhdGEvc3VtRGF0YS5qcyIsIi4uL0RhdGEvRmlsdGVyRGF0YS5qcyIsIi4uL0RhdGEvc3VtRGF0YUJ5U3RhdGUuanMiLCIuLi9CYXJDb2xvck1hcmsvTWFya3MuanMiLCIuLi9CYXJDb2xvck1hcmsvQXhpc0xlZnQuanMiLCIuLi9Db21tb24vQXhpc0JvdHRvbS5qcyIsIi4uL0JhckNvbG9yTWFyay9CYXItaW5kZXguanMiLCIuLi9NYXBDb2xvck1hcmsvTWFya3MuanMiLCIuLi9NYXBDb2xvck1hcmsvQXhpc1JpZ2h0LmpzIiwiLi4vTWFwQ29sb3JNYXJrL0NvbG9yQmFyTWFyay5qcyIsIi4uL01hcENvbG9yTWFyay9NYXAtaW5kZXguanMiLCIuLi9MaW5lQ29sb3JNYXJrL0F4aXNMZWZ0LmpzIiwiLi4vTGluZUNvbG9yTWFyay9DdXJ2ZU1hcmtzLmpzIiwiLi4vTGluZUNvbG9yTWFyay9Db2xvckxlZ2VuZC5qcyIsIi4uL0xpbmVDb2xvck1hcmsvTGluZS1pbmRleC5qcyIsIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBWYWx1ZUF0dHJpYnV0ZXMgPSBbXG4gIHsgdmFsdWU6ICdJTElfUGVyY2VudCcsIGxhYmVsOiAnSUxJIFBlcmNlbnRhZ2UnIH0sXG4gIHsgdmFsdWU6ICdJTElfVG90YWwnLCBsYWJlbDogJ0lMSSBUb3RhbCcgfSxcbiAgeyB2YWx1ZTogJ1Byb3ZpZGVycycsIGxhYmVsOiAnUHJvdmlkZXJzJyB9LFxuICB7IHZhbHVlOiAnUGF0X1RvdGFsJywgbGFiZWw6ICdUb3RhbCBQYXRpZW50cycgfVxuXTtcblxuZXhwb3J0IGNvbnN0IEZpZWxkQXR0cmlidXRlcyA9IFtcbiAgeyB2YWx1ZTogJ1N0YXRlJywgbGFiZWw6ICdTdGF0ZScgfSxcbiAgeyB2YWx1ZTogJ1llYXInLCBsYWJlbDogJ1llYXInIH0sXG4gIHsgdmFsdWU6ICdXZWVrJywgbGFiZWw6ICdXZWVrIG9mIHRoZSBZZWFyJyB9XG5dO1xuXG5leHBvcnQgY29uc3QgZ2V0TGFiZWwgPSAodmFsdWUsIGF0dHJpYnV0ZXMpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGF0dHJpYnV0ZXNbaV0udmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlc1tpXS5sYWJlbDtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBOdW1PZlN0YXRlcyA9IFtcbiAgeyB2YWx1ZTogJzEwJywgbGFiZWw6ICcxMCcgfSxcbiAgeyB2YWx1ZTogJzcnLCBsYWJlbDogJzcnIH0sXG4gIHsgdmFsdWU6ICc1JywgbGFiZWw6ICc1JyB9LFxuICB7IHZhbHVlOiAnMycsIGxhYmVsOiAnMycgfVxuXTtcblxuZXhwb3J0IGNvbnN0IEdyb3VwNUNvbG9yID0gW1xuICAnI2U0MWExYycsXG4gICcjMzc3ZWI4JyxcbiAgJyM0ZGFmNGEnLFxuICAnIzk4NGVhMycsXG4gICcjZmY3ZjAwJ1xuXTtcblxuZXhwb3J0IGNvbnN0IEdyb3VwMTBDb2xvciA9IFtcbiAgJyNmNDJhMGMnLFxuICAnIzA2MmVjMycsXG4gICcjZmY3ZjAwJyxcbiAgJyM0ZDlmNGEnLFxuICAnIzk4NGVhMycsXG4gICcjZjcyOThhJyxcbiAgJyMzN2FlYjgnLFxuICAnI2Q5NWYwMicsXG4gICcjNjZjNjBlJyxcbiAgJyNmYjdhODknXG5dO1xuIiwiLy8gQXBwZWFyYW5jZSBjdXN0b21pemF0aW9uIHRvIGltcHJvdmUgcmVhZGFiaWxpdHkuXG4vLyBTZWUgaHR0cHM6Ly92ZWdhLmdpdGh1Yi5pby92ZWdhLWxpdGUvZG9jcy9cbmNvbnN0IGRhcmsgPSAnIzNlM2MzOCc7XG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xuICBheGlzOiB7XG4gICAgZG9tYWluOiBmYWxzZSxcbiAgICB0aWNrQ29sb3I6ICdsaWdodEdyYXknXG4gIH0sXG4gIHN0eWxlOiB7XG4gICAgXCJndWlkZS1sYWJlbFwiOiB7XG4gICAgICBmb250U2l6ZTogMjAsXG4gICAgICBmaWxsOiBkYXJrXG4gICAgfSxcbiAgICBcImd1aWRlLXRpdGxlXCI6IHtcbiAgICAgIGZvbnRTaXplOiAzMCxcbiAgICAgIGZpbGw6IGRhcmtcbiAgICB9XG4gIH1cbn07IiwiaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNzdiB9IGZyb20gJ2QzJztcblxuY29uc3QgY3N2VXJsID0gJ2h0dHBzOi8vZ2lzdC5naXRodWJ1c2VyY29udGVudC5jb20veXV6aGFuZzIxL2FmZDFhZjNhMjg2MzFhMTJkZmQ4ZWVlMzc1MjAzMDlmL3Jhdy9JTElOZXQwMi5jc3YnO1xuXG5leHBvcnQgY29uc3QgdXNlRGF0YSA9ICgpID0+IHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUobnVsbCk7XG4gIFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHJvdyA9IGQgPT4ge1xuICAgICAgZC5ZZWFyID0gK2QuWUVBUjtcbiAgICAgIGQuV2VlayA9ICtkLldFRUs7XG4gICAgICBkLlN0YXRlID0gZC5SRUdJT047IC8vTmVlZCBhIGx1dCB0byBpZCByZWxhdGVkIHRvIG1hcFxuICAgICAgZC5JTElfUGVyY2VudCA9ICtkWyclVU5XRUlHSFRFRCBJTEknXTtcbiAgICAgIGQuSUxJX1RvdGFsID0gK2QuSUxJVE9UQUw7XG4gICAgICBkLlByb3ZpZGVycyA9ICtkWydOVU0gT0YgUFJPVklERVJTJ107XG4gICAgICBkLlBhdF9Ub3RhbCA9ICtkWydUT1RBTCBQQVRJRU5UUyddO1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfTtcbiAgICBjc3YoY3N2VXJsLCByb3cpLnRoZW4oc2V0RGF0YSk7XG4gIH0sIFtdKTtcbiAgXG4gIHJldHVybiBkYXRhO1xufTtcbiIsImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBqc29uIH0gZnJvbSAnZDMnO1xuaW1wb3J0IHsgZmVhdHVyZSwgbWVzaCB9IGZyb20gJ3RvcG9qc29uJztcblxuY29uc3QganNvblVybCA9ICdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL3VzLWF0bGFzQDMvc3RhdGVzLTEwbS5qc29uJztcblxuZXhwb3J0IGNvbnN0IGdldFVzQXRsYXMgPSAoKSA9PiB7XG4gIGNvbnN0IFtkYXRhLCBzZXREYXRhXSA9IHVzZVN0YXRlKG51bGwpO1xuXG4gICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICBqc29uKGpzb25VcmwpLnRoZW4odG9wb2xvZ3kgPT4ge1xuICAgICAgIGNvbnN0IHsgc3RhdGVzLCBuYXRpb24gfSA9IHRvcG9sb2d5Lm9iamVjdHM7XG4gICAgICAgY29uc29sZS5sb2coJ0xvYWQgbWFwIGZpbGUuLi4nKTtcbiAgICAgICAvL2RlYnVnZ2VyKCk7XG4gICAgICAgc2V0RGF0YSh7XG4gICAgICAgICBzdGF0ZXM6IGZlYXR1cmUodG9wb2xvZ3ksIHN0YXRlcyksXG4gICAgICAgICBpbnRlcmlvcnM6IG1lc2godG9wb2xvZ3ksIHN0YXRlcywgKGEsIGIpID0+IGEgIT09IGIpXG4gICAgICAgfSk7XG4gICAgIH0pO1xuICAgfSwgW10pO1xuXG4gIHJldHVybiBkYXRhO1xufTtcblxuIiwiaW1wb3J0IHsgZGVzY2VuZGluZyB9IGZyb20gJ2QzJztcblxuLy9JbiB0aGlzIGZ1bmN0aW9uLCB3ZSBhY2N1bXVsYXRlIGFsbCBzdGF0ZXMgZGF0YSBieSB3ZWVrcyBmb3IgZGlmZmVyZW50IHllYXJcbi8vU28gaXQgaGFzIHR3byBmaWVsZHMsIGFuZCB3ZSBjYW4gY3JlYXRlIGEgdW5pcXVlIGtleSBmcm9tIHRoZW1cbmV4cG9ydCBjb25zdCBnZXRTdW1EYXRhID0gKGRhdGEsIHhWYWx1ZSkgPT4ge1xuICAvLyAgY29uc29sZS5sb2coXCJzdW1EYXRhIGRhdGE6IFwiLCBkYXRhKTtcbiAgLy9cdGNvbnNvbGUubG9nKFwic3VtRGF0YSB4VmFsdWU6IFwiLCB4VmFsdWUpO1xuICAvLyAgY29uc29sZS5sb2coZGF0YVsxXSk7XG5cbiAgY29uc3QgbyA9IHt9XG4gIGNvbnN0IHJlc3VsdCA9IGRhdGFcbiAgLnJlZHVjZSgociwgZSkgPT4ge1xuICAgIGNvbnN0IGtleSA9IGUuWUVBUiArICd8JyArIGUuV0VFSztcbiAgICBlLnZhbHVlID0geFZhbHVlKGUpO1xuICAgIGlmICghb1trZXldKSB7XG4gICAgICBvW2tleV0gPSBlO1xuICAgICAgb1trZXldLmNvdW50ID0gMDtcbiAgICAgIHIucHVzaChvW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZihlLnZhbHVlID49IDApXG4gICAgICB7XG4gICAgICBcdG9ba2V5XS52YWx1ZSArPSB4VmFsdWUoZSk7XG4gICAgICAgIG9ba2V5XS5jb3VudCArKztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH0sIFtdKVxuICAubWFwKGQgPT4ge2QuYXZnID0gZC52YWx1ZS9kLmNvdW50OyByZXR1cm4gZDt9KTtcbiAgLy9ObyBuZWVkIGJlY2F1c2Ugb2YgbXVsdGlwbGUgdmFyaWFibGVzXG4gIC8vLnNvcnQoKGEsIGIpID0+IGRlc2NlbmRpbmcoYS5hdmcsIGIuYXZnKSk7XG5cblx0Ly9jb25zb2xlLmxvZyhvKVxuXHQvL2NvbnNvbGUubG9nKHJlc3VsdClcblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsImltcG9ydCB7IGRlc2NlbmRpbmcgfSBmcm9tICdkMyc7XG5cbi8vVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBzdW1tYXJ5IG9mIHRoZSB0b3AgMTAgZGF0YSBmb3IgYmFyIGNoYXJ0XG5leHBvcnQgY29uc3QgZ2V0VG9wTlN0YXRlRGF0YSA9IChkYXRhLCB4VmFsdWUsIHRvcFN0YXRlTnVtPTEwKSA9PiB7XG5cbiAgY29uc3Qgc3RhdGVDb3VudHMgPSB7fTtcbiAgY29uc3Qgc3RhdGVUb3RhbHMgPSB7fTtcbiAgY29uc3Qgc3RhdGVTdW1tYXJ5ID0ge307XG5cbiAgY29uc3Qgc3RhdGVUb3RhbFdlZWtseSA9IGRhdGFcbiAgICAuZmlsdGVyKGQgPT4geFZhbHVlKGQpICE9PSAnWCcpXG4vLyAgICAuZmlsdGVyKGQgPT4gZFsnWUVBUiddID09PSAnMjAxOCcpXG4gICAgLm1hcChkID0+IHtcbiAgICAgIGQudmFsdWUgPSB4VmFsdWUoZCk7XG4gICAgICBpZiAoZC52YWx1ZSkge1xuICAgICAgICBpZiAoIXN0YXRlVG90YWxzW2RbJ1JFR0lPTiddXSkge1xuICAgICAgICAgIHN0YXRlVG90YWxzW2RbJ1JFR0lPTiddXSA9IDA7XG4gICAgICAgICAgc3RhdGVDb3VudHNbZFsnUkVHSU9OJ11dID0gMDtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZVRvdGFsc1tkWydSRUdJT04nXV0gKz0gZC52YWx1ZTtcbiAgICAgICAgc3RhdGVDb3VudHNbZFsnUkVHSU9OJ11dKys7XG4gICAgICB9XG4gICAgICByZXR1cm4gZDtcbiAgICB9KTtcbiAgLy8gY29uc29sZS5sb2coc3RhdGVUb3RhbFdlZWtseSk7XG4gIC8vIGNvbnNvbGUubG9nKHN0YXRlVG90YWxzKTtcbiAgLy8gY29uc29sZS5sb2coc3RhdGVDb3VudHMpO1xuXG4gIGNvbnN0IHRvcFN0YXRlcyA9IHt9O1xuXG4gIGNvbnN0IHRvcERhdGEgPSBkYXRhLmZpbHRlcihkID0+IHRvcFN0YXRlc1tkWydTdGF0ZSddXSk7XG4vLyAgY29uc29sZS5sb2codG9wRGF0YSk7XG5cbiAgY29uc3QgYXJyYXkxID0gT2JqZWN0LnZhbHVlcyhzdGF0ZVRvdGFscyk7XG4gIGNvbnN0IGFycmF5MiA9IE9iamVjdC52YWx1ZXMoc3RhdGVDb3VudHMpO1xuICBjb25zdCBhcnJheTMgPSBPYmplY3Qua2V5cyhzdGF0ZVRvdGFscykubWFwKChzdGF0ZSwgaSkgPT4ge1xuICAgIHJldHVybiB7IHN0YXRlOiBzdGF0ZSxcbiAgICAgICB0b3RhbDogYXJyYXkxW2ldLFxuICAgICAgIGNvdW50OiBhcnJheTJbaV0sXG4gICAgICAgYXZnOiBhcnJheTFbaV0vYXJyYXkyW2ldIH07XG4gIH0pO1xuXG4vLyAgY29uc29sZS5sb2coYXJyYXkzKTtcblxuICBjb25zdCBhcnJheTQgPSBhcnJheTNcbiAgICAuc29ydCgoYSwgYikgPT4gZGVzY2VuZGluZyhhLmF2ZywgYi5hdmcpKVxuICAgIC5zbGljZSgwLCB0b3BTdGF0ZU51bSk7XG4gIFxuICBhcnJheTQuZm9yRWFjaChkID0+ICh0b3BTdGF0ZXNbZC5zdGF0ZV0gPSB0cnVlKSk7XG5cbiAgLy90b3AgMTAgU3RhdGVzIGZpbGxlZCFcbiAgLy8gY29uc29sZS5sb2codG9wU3RhdGVzKTtcbiAgLy8gY29uc29sZS5sb2coYXJyYXk0KTtcblxuICBjb25zdCB0b3AxMEJhckRhdGEgPSBhcnJheTRcbiAgICAubWFwKChkKSA9PiAoeyBTdGF0ZTogZC5zdGF0ZSwgVHZhbHVlOiBkLmF2ZyB9KSlcbiAgcmV0dXJuIHRvcDEwQmFyRGF0YTtcbn07XG4iLCJleHBvcnQgY29uc3QgZ2V0RmlsdGVyZWREYXRhID0gKGRhdGEsIHllYXJJZCkgPT4ge1xuICByZXR1cm4gZGF0YVxuICAgIC5maWx0ZXIoZCA9PiB5ZWFySWQgIT09IG51bGwgPyBkWydZZWFyJ10gPT09IHllYXJJZCA6IGQpXG4gICAgLmZpbHRlcihkID0+IGQuU3RhdGUgIT09ICdGbG9yaWRhJylcbiAgICAuZmlsdGVyKGQgPT4gZC5TdGF0ZSAhPT0gJ1B1ZXJ0byBSaWNvJylcbiAgICAuZmlsdGVyKGQgPT4gZC5TdGF0ZSAhPT0gJ1ZpcmdpbiBJc2xhbmRzJylcbiAgICAuZmlsdGVyKGQgPT4gZC5TdGF0ZSAhPT0gJ0Rpc3RyaWN0IG9mIENvbHVtYmlhJylcbiAgICAuZmlsdGVyKGQgPT4gZC5TdGF0ZSAhPT0gJ0NvbW1vbndlYWx0aCBvZiB0aGUgTm9ydGhlcm4gTWFyaWFuYSBJc2xhbmRzJyk7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0U3RhdGUyVmFsdWVNYXAgPSAoZGF0YSwgc3RhdGVUb1ZhbHVlKSA9PiB7XG4gIGNvbnN0IHN0YXRlMlZhbHVlID0gbmV3IE1hcCgpO1xuICBcbiAgZGF0YS5mb3JFYWNoKGQgPT4ge1xuICAgIHN0YXRlMlZhbHVlLnNldChkLlN0YXRlLCBzdGF0ZVRvVmFsdWUoZCkpO1xuICB9KTtcbiAgcmV0dXJuIHN0YXRlMlZhbHVlO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFRvcE5TdGF0ZXNGbGFnID0gKGRhdGEsIHRvcE5TdGF0ZXNEYXRhKSA9PiB7XG4gIGNvbnN0IHRvcDEwU3RhdGVzID0ge307XG4gIFxuICB0b3BOU3RhdGVzRGF0YS5mb3JFYWNoKGQgPT4gKHRvcDEwU3RhdGVzW2QuU3RhdGVdID0gdHJ1ZSkpO1xuICBjb25zdCB0b3AxMERhdGEgPSBkYXRhLmZpbHRlcihkID0+IHRvcDEwU3RhdGVzW2RbJ1N0YXRlJ11dKTtcbiAgcmV0dXJuIHRvcDEwRGF0YTtcbn07IiwiaW1wb3J0IHsgZGVzY2VuZGluZywgbWF4IH0gZnJvbSAnZDMnO1xuXG4vL0luIHRoaXMgZnVuY3Rpb24sIHdlIGFjY3VtdWxhdGUgYWxsIHdlZWsgZGF0YSBieSBzdGF0ZSBmb3IgZGlmZmVyZW50IHllYXJcbi8vU28gaXQgaGFzIHR3byBmaWVsZHMsIGFuZCB3ZSBjYW4gY3JlYXRlIGEgdW5pcXVlIGtleSBmcm9tIHRoZW1cbmV4cG9ydCBjb25zdCBnZXRTdW1EYXRhMiA9IChkYXRhLCB4VmFsdWUsIHlWYWx1ZSkgPT4ge1xuICAvLyAgY29uc29sZS5sb2coXCJzdW1EYXRhIGRhdGE6IFwiLCBkYXRhKTtcbiAgLy9cdGNvbnNvbGUubG9nKFwic3VtRGF0YSB4VmFsdWU6IFwiLCB4VmFsdWUpO1xuICAvLyAgY29uc29sZS5sb2coZGF0YVsxXSk7XG5cbiAgY29uc3QgbyA9IHt9XG4gIGNvbnN0IHJlc3VsdCA9IGRhdGFcbiAgLnJlZHVjZSgociwgZSkgPT4ge1xuICAgIGNvbnN0IGtleSA9IGUuWUVBUiArICd8JyArIHlWYWx1ZShlKTtcbiAgICBlLnZhbHVlID0geFZhbHVlKGUpO1xuICAgIGlmICghb1trZXldKSB7XG4gICAgICBvW2tleV0gPSBlO1xuICAgICAgb1trZXldLmNvdW50ID0gMDtcbiAgICAgIHIucHVzaChvW2tleV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZihlLnZhbHVlID49IDApXG4gICAgICB7XG4gICAgICBcdG9ba2V5XS52YWx1ZSArPSB4VmFsdWUoZSk7XG4gICAgICAgIG9ba2V5XS5jb3VudCArKztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH0sIFtdKVxuICAubWFwKGQgPT4ge2QuYXZnID0gZC52YWx1ZS9kLmNvdW50OyByZXR1cm4gZDt9KTtcbiAgLy9ObyBuZWVkIGJlY2F1c2Ugb2YgbXVsdGlwbGUgdmFyaWFibGVzXG4gIC8vLnNvcnQoKGEsIGIpID0+IGRlc2NlbmRpbmcoYS5hdmcsIGIuYXZnKSk7XG5cblx0Ly9jb25zb2xlLmxvZyhvKVxuXHQvL2NvbnNvbGUubG9nKHJlc3VsdClcblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFN1bURhdGFBbGwgPSAoZGF0YSwgeFZhbHVlLCB5VmFsdWUpID0+IHtcbiAgLy8gIGNvbnNvbGUubG9nKFwic3VtRGF0YSBkYXRhOiBcIiwgZGF0YSk7XG4gIC8vXHRjb25zb2xlLmxvZyhcInN1bURhdGEgeFZhbHVlOiBcIiwgeFZhbHVlKTtcbiAgLy8gIGNvbnNvbGUubG9nKGRhdGFbMV0pO1xuXG4gIGNvbnN0IG8gPSB7fVxuICBjb25zdCByZXN1bHQgPSBkYXRhXG4gIC5yZWR1Y2UoKHIsIGUpID0+IHtcbiAgICBjb25zdCBrZXkgPSB5VmFsdWUoZSk7XG4gICAgZS52YWx1ZSA9IHhWYWx1ZShlKTtcbiAgICBpZiAoIW9ba2V5XSkge1xuICAgICAgb1trZXldID0gZTtcbiAgICAgIG9ba2V5XS5jb3VudCA9IDA7XG4gICAgICByLnB1c2gob1trZXldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYoZS52YWx1ZSA+PSAwKVxuICAgICAge1xuICAgICAgXHRvW2tleV0udmFsdWUgKz0geFZhbHVlKGUpO1xuICAgICAgICBvW2tleV0uY291bnQgKys7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByO1xuICB9LCBbXSlcbiAgLm1hcChkID0+IHtkLmF2ZyA9IGQudmFsdWUvZC5jb3VudDsgcmV0dXJuIGQ7fSlcbiAgLnNvcnQoKGEsIGIpID0+IGRlc2NlbmRpbmcoYS5hdmcsIGIuYXZnKSk7XG5cblx0Ly9jb25zb2xlLmxvZyhvKVxuXHQvL2NvbnNvbGUubG9nKHJlc3VsdClcblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsImV4cG9ydCBjb25zdCBCYXJNYXJrcyA9ICh7XG4gIGRhdGEsXG4gIHhTY2FsZSxcbiAgeVNjYWxlLFxuICB4VmFsdWUsXG4gIHlWYWx1ZSxcbiAgY2xyU2NhbGUsXG4gIGNsclZhbHVlLFxuICB0b29sdGlwRm9ybWF0LFxuICB0b3BTdGF0ZXMsXG4gIG9uQ2xpY2ssXG4gIHNlbGVjdGVkVmFsdWUsXG4gIG9uSG92ZXIsXG4gIGhvdmVyZWRWYWx1ZSxcbiAgaG92ZXJPcGFjaXR5LFxuICBmYWRlT3BhY2l0eVxufSkgPT4ge1xuICBjb25zdCBoaWdobGlnaHRTZWxlY3Rpb24gPSBkID0+IHtcbiAgICBjb25zdCBkb21haW5WYWx1ZSA9IHlWYWx1ZShkKTsgLy9zdGF0ZVxuICAgIGNvbnN0IGJrQmFyQ29sb3IgPVxuICAgICAgZG9tYWluVmFsdWUgPT09IHNlbGVjdGVkVmFsdWUgfHwgZG9tYWluVmFsdWUgPT09IGhvdmVyZWRWYWx1ZVxuICAgICAgICA/ICdkYXJrcmVkJ1xuICAgICAgICA6ICd3aGl0ZSc7XG4gICAgcmV0dXJuIChcbiAgICAgIDxyZWN0XG4gICAgICAgIGNsYXNzTmFtZT1cImJhck1hcmtcIlxuICAgICAgICBrZXk9e2RvbWFpblZhbHVlfVxuICAgICAgICB4PXswfVxuICAgICAgICB5PXt5U2NhbGUoZG9tYWluVmFsdWUpIC0gMX1cbiAgICAgICAgd2lkdGg9e3hTY2FsZSh4VmFsdWUoZCkpICsgMX1cbiAgICAgICAgaGVpZ2h0PXt5U2NhbGUuYmFuZHdpZHRoKCkgKyAyfVxuICAgICAgICBmaWxsPXtia0JhckNvbG9yfVxuICAgICAgLz5cbiAgICApO1xuICB9O1xuICBjb25zdCBoaWdobGlnaHRCYXJzID0gZGF0YS5tYXAoZCA9PiB7XG4gICAgY29uc3QgZG9tYWluVmFsdWUgPSB5VmFsdWUoZCk7IC8vc3RhdGVcbiAgICByZXR1cm4gKFxuICAgICAgPGdcbiAgICAgICAgY2xhc3NOYW1lPVwiYmFyc1wiXG4gICAgICAgIG9wYWNpdHk9e1xuICAgICAgICAgIGRvbWFpblZhbHVlID09PSBzZWxlY3RlZFZhbHVlIHx8IGRvbWFpblZhbHVlID09PSBob3ZlcmVkVmFsdWVcbiAgICAgICAgICAgID8gaG92ZXJPcGFjaXR5XG4gICAgICAgICAgICA6IGhvdmVyT3BhY2l0eVxuICAgICAgICB9XG4gICAgICA+XG4gICAgICAgIHtoaWdobGlnaHRTZWxlY3Rpb24oZCl9XG4gICAgICA8L2c+XG4gICAgKTtcbiAgfSk7XG4gIGNvbnN0IG5vcm1hbEJhcnMgPSBkYXRhLm1hcChkID0+IHtcbiAgICBjb25zdCBkb21haW5WYWx1ZSA9IHlWYWx1ZShkKTsgLy9zdGF0ZVxuICAgIHJldHVybiAoXG4gICAgICA8Z1xuICAgICAgICBjbGFzc05hbWU9XCJiYXJzXCJcbiAgICAgICAgb3BhY2l0eT17XG4gICAgICAgICAgZG9tYWluVmFsdWUgPT09IHNlbGVjdGVkVmFsdWUgfHwgZG9tYWluVmFsdWUgPT09IGhvdmVyZWRWYWx1ZVxuICAgICAgICAgICAgPyBob3Zlck9wYWNpdHlcbiAgICAgICAgICAgIDogaG92ZXJPcGFjaXR5XG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAgPHJlY3RcbiAgICAgICAgICBjbGFzc05hbWU9XCJiYXJNYXJrXCJcbiAgICAgICAgICBrZXk9e2RvbWFpblZhbHVlfVxuICAgICAgICAgIHg9ezB9XG4gICAgICAgICAgeT17eVNjYWxlKGRvbWFpblZhbHVlKX1cbiAgICAgICAgICB3aWR0aD17eFNjYWxlKHhWYWx1ZShkKSl9XG4gICAgICAgICAgaGVpZ2h0PXt5U2NhbGUuYmFuZHdpZHRoKCl9XG4gICAgICAgICAgZmlsbD17Y2xyU2NhbGUoY2xyVmFsdWUoZCkpfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgIG9uQ2xpY2soZG9tYWluVmFsdWUpO1xuICAgICAgICAgIH19XG4gICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiB7XG4gICAgICAgICAgICBvbkhvdmVyKGRvbWFpblZhbHVlKTtcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uTW91c2VPdXQ9eygpID0+IHtcbiAgICAgICAgICAgIG9uSG92ZXIobnVsbCk7XG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIDx0aXRsZT57eVZhbHVlKGQpICsgJyA6ICcgKyB0b29sdGlwRm9ybWF0KHhWYWx1ZShkKSl9PC90aXRsZT5cbiAgICAgICAgPC9yZWN0PlxuICAgICAgPC9nPlxuICAgICk7XG4gIH0pO1xuICByZXR1cm4gKDw+e2hpZ2hsaWdodEJhcnN9IHtub3JtYWxCYXJzfTwvPik7XG59O1xuIiwiZXhwb3J0IGNvbnN0IEF4aXNMZWZ0ID0gKHsgeVNjYWxlLCB0aWNrT2Zmc2V0ID0gMyB9KSA9PlxuICB5U2NhbGUuZG9tYWluKCkubWFwKHRpY2tWYWx1ZSA9PiAoXG4gICAgPGcgY2xhc3NOYW1lPVwidGlja1wiPlxuICAgICAgPHRleHRcbiAgICAgICAga2V5PXt0aWNrVmFsdWV9XG4gICAgICAgIHN0eWxlPXt7IHRleHRBbmNob3I6ICdlbmQnIH19XG4gICAgICAgIHg9ey10aWNrT2Zmc2V0fVxuICAgICAgICBkeT1cIi4zMmVtXCJcbiAgICAgICAgeT17eVNjYWxlKHRpY2tWYWx1ZSkgKyB5U2NhbGUuYmFuZHdpZHRoKCkgLyAyfVxuICAgICAgPlxuICAgICAgICB7dGlja1ZhbHVlfVxuICAgICAgPC90ZXh0PlxuICAgIDwvZz5cbiAgKSk7XG4iLCJleHBvcnQgY29uc3QgQXhpc0JvdHRvbSA9ICh7XG4gIHhTY2FsZSxcbiAgaW5uZXJIZWlnaHQsXG4gIHRpY2tGb3JtYXQsXG4gIHRpY2tPZmZzZXQgPSAzXG59KSA9PlxuICB4U2NhbGUudGlja3MoKS5maWx0ZXIodGljayA9PiBOdW1iZXIuaXNJbnRlZ2VyKHRpY2spKS5tYXAodGlja1ZhbHVlID0+IChcbiAgICA8Z1xuICAgICAgY2xhc3NOYW1lPVwidGlja1wiXG4gICAgICBrZXk9e3RpY2tWYWx1ZX1cbiAgICAgIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgke3hTY2FsZSh0aWNrVmFsdWUpfSwwKWB9XG4gICAgPlxuICAgICAgPGxpbmUgeTI9e2lubmVySGVpZ2h0fSAvPlxuICAgICAgPHRleHRcbiAgICAgICAgc3R5bGU9e3sgdGV4dEFuY2hvcjogJ21pZGRsZScgfX1cbiAgICAgICAgZHk9XCIuNzFlbVwiXG4gICAgICAgIHk9e2lubmVySGVpZ2h0ICsgdGlja09mZnNldH1cbiAgICAgID5cbiAgICAgICAge3RpY2tGb3JtYXQodGlja1ZhbHVlKX1cbiAgICAgIDwvdGV4dD5cbiAgICA8L2c+XG4gICkpO1xuIiwiaW1wb3J0IHsgc2NhbGVCYW5kLCBzY2FsZUxpbmVhciwgc2NhbGVPcmRpbmFsLCBtYXggfSBmcm9tICdkMyc7XG5pbXBvcnQgeyBCYXJNYXJrcyB9IGZyb20gJy4vTWFya3MnO1xuaW1wb3J0IHsgQXhpc0xlZnQgfSBmcm9tICcuL0F4aXNMZWZ0JztcbmltcG9ydCB7IEF4aXNCb3R0b20gfSBmcm9tICcuLi9Db21tb24vQXhpc0JvdHRvbSc7XG5cbmNvbnN0IHhBeGlzTGFiZWxPZmZzZXQgPSAzMDtcbmNvbnN0IHlBeGlzTGFiZWxPZmZzZXQgPSA1MDtcblxuZXhwb3J0IGNvbnN0IEJhckNvbG9yTWFyayA9ICh7XG4gIGRhdGEsXG4gIHhWYWx1ZSxcbiAgeVZhbHVlLFxuICBjb2xvclZhbHVlLFxuICB0b3BTdGF0ZXMsXG4gIGdyb3VwQ29sb3JEZWZzLFxuICBpbm5lcldpZHRoLFxuICBpbm5lckhlaWdodCxcbiAgeEF4aXNMYWJlbCxcbiAgeEF4aXNUaWNrRm9ybWF0LFxuICBzZXRTZWxlY3RlZFZhbHVlLFxuICBzZWxlY3RlZFZhbHVlLFxuICBzZXRIb3ZlcmVkVmFsdWUsXG4gIGhvdmVyZWRWYWx1ZSxcbiAgaG92ZXJPcGFjaXR5LFxuICBmYWRlT3BhY2l0eVxufSkgPT4ge1xuICBjb25zb2xlLmxvZygnQ2FsbGluZyBCYXJDb2xvck1hcmsuLi4nKTtcblxuICBjb25zdCB5QmFyU2NhbGUgPSBzY2FsZUJhbmQoKVxuICAgIC5kb21haW4oZGF0YS5tYXAoeVZhbHVlKSlcbiAgICAucmFuZ2UoWzAsIGlubmVySGVpZ2h0XSlcbiAgICAucGFkZGluZ0lubmVyKDAuMTUpO1xuXG4gIC8vVGhpcyBpcyBmb3IgbWF4LCB3ZSBzaG91bGQgZG8gc3RoIGRpZmZlcmVudCFcbiAgY29uc3QgeEJhclNjYWxlID0gc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oWzAsIG1heChkYXRhLCB4VmFsdWUpXSlcbiAgICAucmFuZ2UoWzAsIGlubmVyV2lkdGhdKTtcblxuICBjb25zdCBjb2xvclNjYWxlID0gc2NhbGVPcmRpbmFsKClcbiAgICAuZG9tYWluKGRhdGEubWFwKGNvbG9yVmFsdWUpKVxuICAgIC5yYW5nZShncm91cENvbG9yRGVmcyk7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPHJlY3Qgd2lkdGg9e2lubmVyV2lkdGh9IGhlaWdodD17aW5uZXJIZWlnaHR9IGZpbGw9XCJ3aGl0ZVwiIC8+XG4gICAgICA8QXhpc0JvdHRvbVxuICAgICAgICB4U2NhbGU9e3hCYXJTY2FsZX1cbiAgICAgICAgaW5uZXJIZWlnaHQ9e2lubmVySGVpZ2h0fVxuICAgICAgICB0aWNrRm9ybWF0PXt4QXhpc1RpY2tGb3JtYXR9XG4gICAgICAvPlxuICAgICAgPEF4aXNMZWZ0IHlTY2FsZT17eUJhclNjYWxlfSAvPlxuICAgICAgPHRleHRcbiAgICAgICAgY2xhc3NOYW1lPVwiYXhpcy1sYWJlbFwiXG4gICAgICAgIHg9e2lubmVyV2lkdGggLyAyfVxuICAgICAgICB5PXtpbm5lckhlaWdodCArIHhBeGlzTGFiZWxPZmZzZXR9XG4gICAgICAgIHRleHRBbmNob3I9XCJtaWRkbGVcIlxuICAgICAgPlxuICAgICAgICB7eEF4aXNMYWJlbH1cbiAgICAgIDwvdGV4dD5cbiAgICAgIDxCYXJNYXJrc1xuICAgICAgICBkYXRhPXtkYXRhfVxuICAgICAgICB4U2NhbGU9e3hCYXJTY2FsZX1cbiAgICAgICAgeVNjYWxlPXt5QmFyU2NhbGV9XG4gICAgICAgIHhWYWx1ZT17eFZhbHVlfVxuICAgICAgICB5VmFsdWU9e3lWYWx1ZX1cbiAgICAgICAgY2xyU2NhbGU9e2NvbG9yU2NhbGV9XG4gICAgICAgIGNsclZhbHVlPXtjb2xvclZhbHVlfVxuICAgICAgICB0b29sdGlwRm9ybWF0PXt4QXhpc1RpY2tGb3JtYXR9XG5cdFx0XHQgIHRvcFN0YXRlcz17dG9wU3RhdGVzfVxuICAgICAgICBvbkNsaWNrPXtzZXRTZWxlY3RlZFZhbHVlfVxuICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RlZFZhbHVlfVxuICAgICAgICBvbkhvdmVyPXtzZXRIb3ZlcmVkVmFsdWV9XG4gICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFZhbHVlfVxuICAgICAgICBob3Zlck9wYWNpdHk9e2hvdmVyT3BhY2l0eX1cbiAgICAgICAgZmFkZU9wYWNpdHk9e2ZhZGVPcGFjaXR5fVxuICAgICAgLz5cbiAgICA8Lz5cbiAgKTtcbn07XG4iLCJpbXBvcnQgeyBnZW9BbGJlcnNVc2EsIGdlb0FsYmVycywgZ2VvUGF0aCwgZ2VvR3JhdGljdWxlIH0gZnJvbSAnZDMnO1xuaW1wb3J0IHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0JztcblxuLy9jb25zdCBwcm9qZWN0aW9uID0gZ2VvQWxiZXJzKCk7XG5jb25zdCBwcm9qZWN0aW9uID0gZ2VvQWxiZXJzVXNhKCk7XG5jb25zdCBwYXRoUHJvaiA9IGdlb1BhdGgocHJvamVjdGlvbik7XG5jb25zdCBncmF0aWN1bGUgPSBnZW9HcmF0aWN1bGUoKTtcblxuY29uc3QgbWlzc2luZ0RhdGFDb2xvciA9ICdncmF5JztcblxuZXhwb3J0IGNvbnN0IE1hcE1hcmtzID0gKHtcbiAgZGF0YSxcbiAgZGF0YU1hcCxcbiAgdG9wU3RhdGVzLFxuICBhdGxhczogeyBzdGF0ZXMsIGludGVyaW9ycyB9LFxuICBjb2xvclNjYWxlLFxuICBjb2xvclZhbHVlLFxuICB0b29sdGlwVmFsdWUsXG4gIHRvb2x0aXBGb3JtYXQsXG4gIG9uQ2xpY2ssXG4gIHNlbGVjdGVkVmFsdWUsXG4gIG9uSG92ZXIsXG4gIGhvdmVyZWRWYWx1ZSxcbiAgaG92ZXJPcGFjaXR5LFxuICBmYWRlT3BhY2l0eVxufSkgPT4gKFxuICA8ZyBjbGFzc05hbWU9XCJtYXJrc1wiPlxuICAgIHt1c2VNZW1vKFxuICAgICAgKCkgPT4gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxwYXRoIGNsYXNzTmFtZT1cInNwaGVyZVwiIGQ9e3BhdGhQcm9qKHsgdHlwZTogJ1NwaGVyZScgfSl9IC8+XG4gICAgICAgICAgPHBhdGggY2xhc3NOYW1lPVwiZ3JhdGljdWxlc1wiIGQ9e3BhdGhQcm9qKGdyYXRpY3VsZSgpKX0gLz5cbiAgICAgICAgICA8cGF0aCBjbGFzc05hbWU9XCJpbnRlcmlvcnNcIiBkPXtwYXRoUHJvaihpbnRlcmlvcnMpfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICksXG4gICAgICBbcGF0aFByb2osIGdyYXRpY3VsZV1cbiAgICApfVxuICAgIHt1c2VNZW1vKFxuICAgICAgKCkgPT5cbiAgICAgICAgc3RhdGVzLmZlYXR1cmVzLm1hcChmZWF0dXJlID0+IHtcbiAgICAgICAgICBjb25zdCB5SWQgPSBmZWF0dXJlLnByb3BlcnRpZXMubmFtZTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmZWF0dXJlTmFtZTonLCB5SWQpO1xuICAgICAgICAgIGNvbnN0IHN0YXRlQ29sb3IgPSBvYmogPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgICAgLmZpbHRlcihkID0+IGQuU3RhdGUgPT09IG9iai5wcm9wZXJ0aWVzLm5hbWUpXG4gICAgICAgICAgICAgIC5tYXAoZCA9PiBjb2xvclNjYWxlKGNvbG9yVmFsdWUoZCkpKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IGlzVG9wID0gdmFsdWUgPT4gdG9wU3RhdGVzLmZpbHRlcihkID0+IGQuU3RhdGUgPT09IHZhbHVlKTtcblxuICAgICAgICAgIC8vTm90ZTogKGtlZXApc3RhdGVDb2xvcihmZWF0dXJlKSBubyBsb25nZXIgdXNlZCFcbiAgICAgICAgICBjb25zdCBkID0gZGF0YU1hcC5nZXQoZmVhdHVyZS5wcm9wZXJ0aWVzLm5hbWUpO1xuICAgICAgICAgIGlmICghZCkge1xuICAgICAgICAgICAgLy9XZSBrbm93IGEgZmV3IHN0YXRlcyBhcmUgaWdub3JlZCBpbiBkYXRhTWFwLlxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhmZWF0dXJlLnByb3BlcnRpZXMubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vY29uc29sZS5sb2coZGF0YU1hcCk7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImxhbmQtc3RhdGVcIlxuICAgICAgICAgICAgICBkPXtwYXRoUHJvaihmZWF0dXJlKX1cbiAgICAgICAgICAgICAgZmlsbD17ZCA/IGNvbG9yU2NhbGUoZCkgOiBtaXNzaW5nRGF0YUNvbG9yfVxuICAgICAgICAgICAgICBzdHJva2U9e1xuICAgICAgICAgICAgICAgIHlJZCA9PT0gc2VsZWN0ZWRWYWx1ZSB8fCB5SWQgPT09IGhvdmVyZWRWYWx1ZVxuICAgICAgICAgICAgICAgICAgPyAnd2hpdGUnXG4gICAgICAgICAgICAgICAgICA6ICdsaWdodGdyZXknXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3Ryb2tlLXdpZHRoPXtcbiAgICAgICAgICAgICAgICB5SWQgPT09IHNlbGVjdGVkVmFsdWUgfHwgeUlkID09PSBob3ZlcmVkVmFsdWUgPyAzIDogMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNUb3AoeUlkKS5sZW5ndGgpIG9uQ2xpY2soeUlkKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGlzVG9wKHlJZCkubGVuZ3RoKSBvbkhvdmVyKHlJZCk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uTW91c2VPdXQ9eygpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNUb3AoeUlkKS5sZW5ndGgpIG9uSG92ZXIobnVsbCk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDx0aXRsZT57eUlkICsgJyA6ICcgKyB0b29sdGlwRm9ybWF0KGRhdGFNYXAuZ2V0KHlJZCkpfTwvdGl0bGU+XG4gICAgICAgICAgICA8L3BhdGg+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSksXG4gICAgICBbcGF0aFByb2osIHN0YXRlcywgZGF0YU1hcF1cbiAgICApfVxuICA8L2c+XG4pO1xuIiwiZXhwb3J0IGNvbnN0IEF4aXNSaWdodCA9ICh7IHlTY2FsZSwgdGlja09mZnNldCB9KSA9PlxuICB5U2NhbGUudGlja3MoKS5tYXAodGlja1ZhbHVlID0+IChcbiAgICA8ZyBjbGFzc05hbWU9XCJ0aWNrXCIgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKDAsJHt5U2NhbGUodGlja1ZhbHVlKX0pYH0+XG4gICAgICA8dGV4dFxuICAgICAgICBrZXk9e3RpY2tWYWx1ZX1cbiAgICAgICAgc3R5bGU9e3sgdGV4dEFuY2hvcjogJ2VuZCcgfX1cbiAgICAgICAgeD17dGlja09mZnNldH1cbiAgICAgICAgZHk9XCIuMjJlbVwiXG4gICAgICA+XG4gICAgICAgIHt0aWNrVmFsdWV9XG4gICAgICA8L3RleHQ+XG4gICAgPC9nPlxuICApKTtcbiIsImV4cG9ydCBjb25zdCBDb2xvckJhck1hcmsgPSAoe1xuICBkYXRhU2VnbWVudCA9IDgsXG4gIGRhdGFFeHRlbnQsXG4gIGNvbG9yU2NhbGUsXG4gIGJhcldpZHRoLFxuICBiYXJIZWlnaHQsXG4gIHRvb2x0aXBGb3JtYXRcbn0pID0+IHtcbiAgY29uc3QgZ2V0Q2VudGVyID0gZCA9PlxuICAgICgoZCArIDAuNSkgLyBkYXRhU2VnbWVudCkgKiAoZGF0YUV4dGVudFsxXSAtIGRhdGFFeHRlbnRbMF0pO1xuXG4gIGNvbnN0IENvbG9yQmFyID0gKHsgZGF0YSwgZWxlbU9mZnNldCB9KSA9PlxuICAgIGRhdGEubWFwKGlkID0+IChcbiAgICAgIDxnIGNsYXNzTmFtZT1cImJhcnNcIj5cbiAgICAgICAgPHJlY3RcbiAgICAgICAgICBjbGFzc05hbWU9XCJjb2xvckJhckVsZW1lbnRcIlxuICAgICAgICAgIGtleT17J2JhckVsZW1lbnQnICsgaWR9XG4gICAgICAgICAgeD17MH1cbiAgICAgICAgICB5PXtlbGVtT2Zmc2V0ICogaWR9XG4gICAgICAgICAgd2lkdGg9e2JhcldpZHRofVxuICAgICAgICAgIGhlaWdodD17TWF0aC5jZWlsKGVsZW1PZmZzZXQpICsgMX1cbiAgICAgICAgICBmaWxsPXtjb2xvclNjYWxlKGdldENlbnRlcihpZCkpfVxuICAgICAgICA+XG4gICAgICAgICAgPHRpdGxlPnt0b29sdGlwRm9ybWF0KGdldENlbnRlcihpZCkpfTwvdGl0bGU+XG4gICAgICAgIDwvcmVjdD5cbiAgICAgIDwvZz5cbiAgICApKTtcblxuICBjb25zdCBkYXRhID0gQXJyYXkuZnJvbShBcnJheShkYXRhU2VnbWVudCkua2V5cygpKTtcbiAgcmV0dXJuIDxDb2xvckJhciBkYXRhPXtkYXRhfSBlbGVtT2Zmc2V0PXtiYXJIZWlnaHQgLyBkYXRhU2VnbWVudH0gLz47XG59O1xuIiwiaW1wb3J0IHtcbiAgaW50ZXJwb2xhdGVWaXJpZGlzLFxuICBpbnRlcnBvbGF0ZVB1UmQsXG4gIGludGVycG9sYXRlWWxPclJkLFxuICBzY2FsZUxpbmVhcixcbiAgc2NhbGVTZXF1ZW50aWFsLFxuICBzY2FsZU9yZGluYWwsXG4gIGV4dGVudCxcbiAgbWF4XG59IGZyb20gJ2QzJztcbmltcG9ydCB7IE1hcE1hcmtzIH0gZnJvbSAnLi9NYXJrcyc7XG5pbXBvcnQgeyBBeGlzUmlnaHQgfSBmcm9tICcuL0F4aXNSaWdodCc7XG5pbXBvcnQgeyBDb2xvckJhck1hcmsgfSBmcm9tICcuL0NvbG9yQmFyTWFyayc7XG5cbmV4cG9ydCBjb25zdCBNYXBDb2xvck1hcmsgPSAoe1xuICBkYXRhLFxuICBhdGxhcyxcbiAgYXZnVmFsdWUsXG4gIHRvcFN0YXRlcyxcbiAgY29sb3JWYWx1ZSxcbiAgaW5uZXJXaWR0aCxcbiAgaW5uZXJIZWlnaHQsXG4gIHRvb2x0aXBWYWx1ZSxcbiAgdG9vbHRpcEZvcm1hdCxcbiAgc2V0U2VsZWN0ZWRWYWx1ZSxcbiAgc2VsZWN0ZWRWYWx1ZSxcbiAgc2V0SG92ZXJlZFZhbHVlLFxuICBob3ZlcmVkVmFsdWUsXG4gIGhvdmVyT3BhY2l0eSxcbiAgZmFkZU9wYWNpdHlcbn0pID0+IHtcbiAgY29uc3QgbGVnZW5kT2Zmc2V0WCA9IGlubmVyV2lkdGggKiAyICsgNTA7XG4gIGNvbnN0IGxlZ2VuZE9mZnNldFkgPSBpbm5lckhlaWdodDtcbiAgY29uc3QgeUNvbG9yQmFyTGFiZWwgPSAnQXZnIFZhbHVlJztcbiAgY29uc3QgYmFyV2lkdGggPSAzMDtcbiAgY29uc3QgYmFySGVpZ2h0ID0gMjAwO1xuICBjb25zdCBiYXJMaW5lT2Zmc2V0ID0gMDsgLy9UaGlzIG9mZnNldCBpcyBkb25lIG9uIHB1cnBvc2UgYmVjYXVzZSBvZiB0aGUgcmFuZ2VcblxuICBjb25zb2xlLmxvZygnQ2FsbGluZyBNYXBDb2xvck1hcmsuLi4nKTtcbiAgLy9jb25zb2xlLmxvZyhleHRlbnQoZGF0YSwgYXZnVmFsdWUpKTtcbiAgLy9jb25zb2xlLmxvZyh0b29sdGlwVmFsdWUpO1xuICAvL2NvbnNvbGUubG9nKGF2Z1ZhbHVlKTtcbiAgY29uc3QgZmlsdGVyZWREYXRhID0gZGF0YVxuICAgIC5maWx0ZXIoZCA9PiBjb2xvclZhbHVlKGQpICE9PSAnUHVlcnRvIFJpY28nKVxuICAgIC5maWx0ZXIoZCA9PiBjb2xvclZhbHVlKGQpICE9PSAnRGlzdHJpY3Qgb2YgQ29sdW1iaWEnKTtcblxuICBjb25zdCBzdGF0ZTJWYWx1ZSA9IG5ldyBNYXAoKTtcbiAgZmlsdGVyZWREYXRhLmZvckVhY2goZCA9PiB7XG4gICAgc3RhdGUyVmFsdWUuc2V0KGNvbG9yVmFsdWUoZCksIGF2Z1ZhbHVlKGQpKTtcbiAgfSk7XG4gIGNvbnN0IG5ld0V4dGVudCA9IGV4dGVudChmaWx0ZXJlZERhdGEsIGF2Z1ZhbHVlKTtcbiAgbmV3RXh0ZW50WzBdID0gTWF0aC5mbG9vcihuZXdFeHRlbnRbMF0pO1xuICBuZXdFeHRlbnRbMV0gPSBNYXRoLmNlaWwobmV3RXh0ZW50WzFdKTtcblxuICBjb25zdCB5U2NhbGUgPSBzY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihuZXdFeHRlbnQpXG4gICAgLnJhbmdlKFswLCBiYXJIZWlnaHRdKTtcblxuICAvL05vdGUgdGhhdCBzY2hlbWVZbE9yUmQgYW5kIGludGVycG9sYXRlUHVSZCBhcmUgZGlmZmVyZW50XG4gIC8vVXNlIGludGVycG9sYXRlWWxPclJkIGluc3RlYWRcbiAgY29uc3QgbWFwQ29sb3JTY2FsZSA9IHNjYWxlU2VxdWVudGlhbChpbnRlcnBvbGF0ZVlsT3JSZClcbiAgICAuZG9tYWluKG5ld0V4dGVudCk7XG4gIFxuICBjb25zdCBtYXBDb2xvclNjYWxlMSA9IHNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKG5ld0V4dGVudClcbiAgICAucmFuZ2UoWyd3aGl0ZScsICdibHVlJ10pO1xuXG4gIGNvbnN0IG1hcENvbG9yU2NhbGUyID0gc2NhbGVTZXF1ZW50aWFsKClcbiAgICAuZG9tYWluKG5ld0V4dGVudClcbiAgICAuaW50ZXJwb2xhdG9yKGludGVycG9sYXRlUHVSZCk7XG4gIC8vICAgXHQuaW50ZXJwb2xhdG9yKGludGVycG9sYXRlVmlyaWRpcyk7IC8vaW50ZXJwb2xhdGVQdVJkXG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPE1hcE1hcmtzXG4gICAgICAgIGRhdGE9e2ZpbHRlcmVkRGF0YX1cbiAgICAgICAgZGF0YU1hcD17c3RhdGUyVmFsdWV9XG5cdFx0XHQgIHRvcFN0YXRlcz17dG9wU3RhdGVzfVxuICAgICAgICBhdGxhcz17YXRsYXN9XG4gICAgICAgIGNvbG9yVmFsdWU9e2F2Z1ZhbHVlfVxuICAgICAgICBjb2xvclNjYWxlPXttYXBDb2xvclNjYWxlfVxuICAgICAgICB0b29sdGlwVmFsdWU9e2F2Z1ZhbHVlfVxuICAgICAgICB0b29sdGlwRm9ybWF0PXt0b29sdGlwRm9ybWF0fVxuICAgICAgICBvbkNsaWNrPXtzZXRTZWxlY3RlZFZhbHVlfVxuICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RlZFZhbHVlfVxuICAgICAgICBvbkhvdmVyPXtzZXRIb3ZlcmVkVmFsdWV9XG4gICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFZhbHVlfVxuICAgICAgICBob3Zlck9wYWNpdHk9e2hvdmVyT3BhY2l0eX1cbiAgICAgICAgZmFkZU9wYWNpdHk9e2ZhZGVPcGFjaXR5fVxuICAgICAgLz5cbiAgICAgIDxnIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgke2xlZ2VuZE9mZnNldFh9LCAke2xlZ2VuZE9mZnNldFl9KWB9PlxuICAgICAgICA8Q29sb3JCYXJNYXJrXG4gICAgICAgICAgZGF0YVNlZ21lbnQ9ezY2fVxuICAgICAgICAgIGRhdGFFeHRlbnQ9e25ld0V4dGVudH1cbiAgICAgICAgICBjb2xvclNjYWxlPXttYXBDb2xvclNjYWxlfVxuICAgICAgICAgIGJhcldpZHRoPXtiYXJXaWR0aH1cbiAgICAgICAgICBiYXJIZWlnaHQ9e2JhckhlaWdodH1cbiAgICAgICAgICB0b29sdGlwRm9ybWF0PXt0b29sdGlwRm9ybWF0fVxuICAgICAgICAvPlxuICAgICAgICA8QXhpc1JpZ2h0IHlTY2FsZT17eVNjYWxlfSB0aWNrT2Zmc2V0PXtiYXJXaWR0aCArIDQwfSAvPlxuICAgICAgICB7KHZhbHVlID0+IHtcbiAgICAgICAgICBjb25zdCB5TGV2ZWwgPSBzdGF0ZTJWYWx1ZS5nZXQodmFsdWUpO1xuICAgICAgICAgIHJldHVybiB5TGV2ZWwgPyAoXG4gICAgICAgICAgICA8bGluZVxuICAgICAgICAgICAgICB4MT17MH1cbiAgICAgICAgICAgICAgeTE9e3lTY2FsZSh5TGV2ZWwpIC0gYmFyTGluZU9mZnNldH1cbiAgICAgICAgICAgICAgeDI9e2JhcldpZHRofVxuICAgICAgICAgICAgICB5Mj17eVNjYWxlKHlMZXZlbCkgLSBiYXJMaW5lT2Zmc2V0fVxuICAgICAgICAgICAgICBzdHJva2U9XCJjeWFuXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgKSA6IG51bGw7XG4gICAgICAgIH0pKGhvdmVyZWRWYWx1ZSl9XG4gICAgICAgIHsodmFsdWUgPT4ge1xuICAgICAgICAgIGNvbnN0IHlMZXZlbCA9IHN0YXRlMlZhbHVlLmdldCh2YWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIHlMZXZlbCA/IChcbiAgICAgICAgICAgIDxsaW5lXG4gICAgICAgICAgICAgIHgxPXswfVxuICAgICAgICAgICAgICB5MT17eVNjYWxlKHlMZXZlbCkgLSBiYXJMaW5lT2Zmc2V0fVxuICAgICAgICAgICAgICB4Mj17YmFyV2lkdGh9XG4gICAgICAgICAgICAgIHkyPXt5U2NhbGUoeUxldmVsKSAtIGJhckxpbmVPZmZzZXR9XG4gICAgICAgICAgICAgIHN0cm9rZT1cImxpZ2h0Z3JlZW5cIlxuICAgICAgICAgICAgICBzdHJva2Utd2lkdGg9ezJ9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkgOiBudWxsO1xuICAgICAgICB9KShzZWxlY3RlZFZhbHVlKX1cbiAgICAgICAgPHRleHQgY2xhc3NOYW1lPVwiYXhpcy1sYWJlbFwiIHg9e2JhcldpZHRofSB5PXstMTB9IHRleHRBbmNob3I9XCJtaWRkbGVcIj5cbiAgICAgICAgICB7eUNvbG9yQmFyTGFiZWx9XG4gICAgICAgIDwvdGV4dD5cbiAgICAgIDwvZz5cbiAgICA8Lz5cbiAgKTtcbn07XG4iLCJleHBvcnQgY29uc3QgQXhpc0xlZnQgPSAoeyB5U2NhbGUsIGlubmVyV2lkdGgsIHRpY2tPZmZzZXQgPSAzIH0pID0+XG4gIHlTY2FsZS50aWNrcygpLm1hcCh0aWNrVmFsdWUgPT4gKFxuICAgIDxnIGNsYXNzTmFtZT1cInRpY2tcIiB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoMCwke3lTY2FsZSh0aWNrVmFsdWUpfSlgfT5cbiAgICAgIDxsaW5lIHgyPXtpbm5lcldpZHRofSAvPlxuICAgICAgPHRleHRcbiAgICAgICAga2V5PXt0aWNrVmFsdWV9XG4gICAgICAgIHN0eWxlPXt7IHRleHRBbmNob3I6ICdlbmQnIH19XG4gICAgICAgIHg9ey10aWNrT2Zmc2V0fVxuICAgICAgICBkeT1cIi4yMmVtXCJcbiAgICAgID5cbiAgICAgICAge3RpY2tWYWx1ZX1cbiAgICAgIDwvdGV4dD5cbiAgICA8L2c+XG4gICkpO1xuIiwiaW1wb3J0IHsgbGluZSwgY3VydmVOYXR1cmFsLCBjdXJ2ZUNhcmRpbmFsIH0gZnJvbSAnZDMnO1xuXG5leHBvcnQgY29uc3QgQ3VydmVNYXJrcyA9ICh7XG4gIGRhdGEsXG4gIHhTY2FsZSxcbiAgeVNjYWxlLFxuICB4VmFsdWUsXG4gIHlWYWx1ZSxcbiAgY2xyU2NhbGUsXG4gIGNsclZhbHVlLFxuICB0b29sdGlwRm9ybWF0LFxuICBjaXJjbGVSYWRpdXMsXG4gIG9uQ2xpY2ssXG4gIHNlbGVjdGVkVmFsdWUsXG4gIG9uSG92ZXIsXG4gIGhvdmVyZWRWYWx1ZSxcbiAgZmFkZU9wYWNpdHksXG4gIGhvdmVyT3BhY2l0eVxufSkgPT4ge1xuICAvL0dyb3VwIHVzZWQgdG8gYmUgWWVhciwgY2FuIGFsc28gYmUgU3RhdGVcbiAgY29uc3QgZ3JvdXBzID0gZGF0YS5tYXAoZCA9PiBjbHJWYWx1ZShkKSk7XG4gIGNvbnN0IGRpc3RpbmN0R3JvdXBzID0gWy4uLm5ldyBTZXQoZ3JvdXBzKV07XG4gIGNvbnN0IGdyb3VwRGF0YSA9IHlJZCA9PiBkYXRhLmZpbHRlcihkID0+IGNsclZhbHVlKGQpID09PSB5SWQpO1xuLy8gIGNvbnNvbGUubG9nKGRpc3RpbmN0R3JvdXBzLmZpbHRlcihkPT5kPT09aG92ZXJlZFZhbHVlKSwgZGlzdGluY3RHcm91cHMuZmlsdGVyKGQ9PmQ9PT1zZWxlY3RlZFZhbHVlKSk7XG4gIGNvbnN0IGhpZ2hsaWdodFNlbGVjdGlvbiA9IHlJZCA9PlxuICAgIHlJZCA9PT0gaG92ZXJlZFZhbHVlID8gJzEuOCcgOiB5SWQgPT09IHNlbGVjdGVkVmFsdWUgPyAnMS41JyA6ICcxJztcbiAgcmV0dXJuIChcbiAgICA8ZyBjbGFzc05hbWU9XCJsaW5lMVwiPlxuICAgICAge2Rpc3RpbmN0R3JvdXBzLm1hcCh5SWQgPT4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIG9uQ2xpY2soeUlkKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvbk1vdXNlRW50ZXI9eygpID0+IHtcbiAgICAgICAgICAgICAgb25Ib3Zlcih5SWQpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uTW91c2VPdXQ9eygpID0+IHtcbiAgICAgICAgICAgICAgb25Ib3ZlcihudWxsKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBvcGFjaXR5PXtcbiAgICAgICAgICAgICAgeUlkID09PSBzZWxlY3RlZFZhbHVlIHx8IHlJZCA9PT0gaG92ZXJlZFZhbHVlXG4gICAgICAgICAgICAgICAgPyBob3Zlck9wYWNpdHlcbiAgICAgICAgICAgICAgICA6IGZhZGVPcGFjaXR5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxsPVwibm9uZVwiXG4gICAgICAgICAgICBzdHJva2U9e2NsclNjYWxlKHlJZCl9XG4gICAgICAgICAgICBzdHJva2Utd2lkdGg9e2hpZ2hsaWdodFNlbGVjdGlvbih5SWQpfVxuICAgICAgICAgICAgZD17bGluZSgpXG4gICAgICAgICAgICAgIC54KGQgPT4geFNjYWxlKHhWYWx1ZShkKSkpXG4gICAgICAgICAgICAgIC55KGQgPT4geVNjYWxlKHlWYWx1ZShkKSkpXG4gICAgICAgICAgICAgIC5jdXJ2ZShjdXJ2ZUNhcmRpbmFsLnRlbnNpb24oMS4wKSkoZ3JvdXBEYXRhKHlJZCkpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDx0aXRsZT57eUlkfTwvdGl0bGU+XG4gICAgICAgICAgPC9wYXRoPlxuICAgICAgICApO1xuICAgICAgfSl9XG4gICAgPC9nPlxuICApO1xufTtcbiIsImV4cG9ydCBjb25zdCBDb2xvckxlZ2VuZCA9ICh7XG4gIGNvbG9yU2NhbGUsXG4gIHRpY2tTcGFjaW5nID0gMjAsXG4gIHRpY2tXaWR0aCA9IDE2LFxuICB0aWNrSGVpZ2h0ID0gNCxcbiAgdGlja1RleHRPZmZzZXQgPSAyMCxcbiAgb25DbGljayxcbiAgc2VsZWN0ZWRWYWx1ZSxcbiAgb25Ib3ZlcixcbiAgaG92ZXJlZFZhbHVlLFxuICBob3Zlck9wYWNpdHksXG4gIGZhZGVPcGFjaXR5XG59KSA9PlxuICBjb2xvclNjYWxlLmRvbWFpbigpLm1hcCgoZG9tYWluVmFsdWUsIGkpID0+IHtcbiAgICBjb25zdCBzaXplRXh0cmEgPSAyO1xuICAgIGNvbnN0IGhpZ2hsaWdodFNlbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIGlmIChkb21haW5WYWx1ZSA9PT0gc2VsZWN0ZWRWYWx1ZSlcbiAgICAgICAgcmV0dXJuICg8cmVjdFxuICAgICAgICAgIGZpbGw9eydkYXJrcmVkJ31cbiAgICAgICAgICB4PXstKHRpY2tXaWR0aCtzaXplRXh0cmEpLzJ9XG4gICAgICAgICAgeT17LSh0aWNrSGVpZ2h0K3NpemVFeHRyYSkvMn1cbiAgICAgICAgICB3aWR0aD17KHRpY2tXaWR0aCtzaXplRXh0cmEpfVxuICAgICAgICAgIGhlaWdodD17KHRpY2tIZWlnaHQrc2l6ZUV4dHJhKX1cbiAgICAgICAgLz4pO1xuICAgIH07XG4gICAgY29uc3QgaGlnaGxpZ2h0U2VsZWN0ZWRGb250ID0gKCkgPT4ge1xuICAgICAgaWYgKGRvbWFpblZhbHVlID09PSBzZWxlY3RlZFZhbHVlKSByZXR1cm4geyBmb250V2VpZ2h0OiAnYm9sZCcgfTtcbiAgICB9O1xuICAgIHJldHVybiAoXG4gICAgICA8Z1xuICAgICAgICBjbGFzc05hbWU9XCJ0aWNrXCJcbiAgICAgICAgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKDAsJHtpICogdGlja1NwYWNpbmd9KWB9XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICBvbkNsaWNrKGRvbWFpblZhbHVlKTtcbiAgICAgICAgfX1cbiAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiB7XG4gICAgICAgICAgb25Ib3Zlcihkb21haW5WYWx1ZSk7XG4gICAgICAgIH19XG4gICAgICAgIG9uTW91c2VPdXQ9eygpID0+IHtcbiAgICAgICAgICBvbkhvdmVyKG51bGwpO1xuICAgICAgICB9fVxuICAgICAgICBvcGFjaXR5PXtcbiAgICAgICAgICBkb21haW5WYWx1ZSA9PT0gc2VsZWN0ZWRWYWx1ZSB8fCBkb21haW5WYWx1ZSA9PT0gaG92ZXJlZFZhbHVlXG4gICAgICAgICAgICA/IGhvdmVyT3BhY2l0eVxuICAgICAgICAgICAgOiBmYWRlT3BhY2l0eVxuICAgICAgICB9XG4gICAgICA+XG4gICAgICAgIHtoaWdobGlnaHRTZWxlY3Rpb24oKX1cbiAgICAgICAgPHJlY3RcbiAgICAgICAgICBmaWxsPXtjb2xvclNjYWxlKGRvbWFpblZhbHVlKX1cbiAgICAgICAgICB4PXstdGlja1dpZHRoLzJ9XG4gICAgICAgICAgeT17LXRpY2tIZWlnaHQvMn1cbiAgICAgICAgICB3aWR0aD17dGlja1dpZHRofVxuICAgICAgICAgIGhlaWdodD17dGlja0hlaWdodH1cbiAgICAgICAgLz5cbiAgICAgICAgPHRleHQgeD17dGlja1RleHRPZmZzZXR9IGR5PVwiLjMyZW1cIiBzdHlsZT17aGlnaGxpZ2h0U2VsZWN0ZWRGb250KCl9PlxuICAgICAgICAgIHtkb21haW5WYWx1ZX1cbiAgICAgICAgPC90ZXh0PlxuICAgICAgPC9nPlxuICAgICk7XG4gIH0pO1xuIiwiaW1wb3J0IHsgc2NhbGVMaW5lYXIsIHNjYWxlT3JkaW5hbCwgZXh0ZW50IH0gZnJvbSAnZDMnO1xuaW1wb3J0IHsgQXhpc0xlZnQgfSBmcm9tICcuL0F4aXNMZWZ0JztcbmltcG9ydCB7IEF4aXNCb3R0b20gfSBmcm9tICcuLi9Db21tb24vQXhpc0JvdHRvbSc7XG5pbXBvcnQgeyBDdXJ2ZU1hcmtzIH0gZnJvbSAnLi9DdXJ2ZU1hcmtzJztcbmltcG9ydCB7IENvbG9yTGVnZW5kIH0gZnJvbSAnLi9Db2xvckxlZ2VuZCc7XG5cbmV4cG9ydCBjb25zdCBMaW5lQ29sb3JNYXJrID0gKHtcbiAgZGF0YSxcbiAgeFZhbHVlLFxuICB5VmFsdWUsXG4gIHNpemVWYWx1ZSxcbiAgY29sb3JWYWx1ZSxcbiAgY29sb3JEb21haW4sXG4gIGdyb3VwQ29sb3JEZWZzLFxuICBpbm5lcldpZHRoLFxuICBpbm5lckhlaWdodCxcbiAgbGVnZW5kT25MZWZ0LFxuICB4QXhpc0xhYmVsLFxuICB5QXhpc0xhYmVsLFxuICB4QXhpc1RpY2tGb3JtYXQsXG4gIHRvb2x0aXBWYWx1ZSxcbiAgc2V0U2VsZWN0ZWRWYWx1ZSxcbiAgc2VsZWN0ZWRWYWx1ZSxcbiAgc2V0SG92ZXJlZFZhbHVlLFxuICBob3ZlcmVkVmFsdWUsXG4gIGhvdmVyT3BhY2l0eSxcbiAgZmFkZU9wYWNpdHlcbn0pID0+IHtcbiAgY29uc3QgaGFsZldpZHRoID0gaW5uZXJXaWR0aDtcbiAgY29uc3QgaGFsZkhlaWdodCA9IGlubmVySGVpZ2h0O1xuICBjb25zdCBsZWdlbmRPZmZzZXRYID0gbGVnZW5kT25MZWZ0ID8gLTE2MCA6IGhhbGZXaWR0aCAtIDEwO1xuICBjb25zdCBsZWdlbmRPZmZzZXRZID0gbGVnZW5kT25MZWZ0ID8gMzAgOiAxNTtcbiAgY29uc3QgY29sb3JMZWdlbmRMYWJlbCA9IGxlZ2VuZE9uTGVmdCA/ICcnIDogJ1llYXJzJztcbiAgY29uc3QgeEF4aXNMYWJlbE9mZnNldCA9IDMwO1xuICBjb25zdCB5QXhpc0xhYmVsT2Zmc2V0ID0gbGVnZW5kT25MZWZ0ID8gNDUgOiA1MDtcblxuICBjb25zb2xlLmxvZygnQ2FsbGluZyBMaW5lIENvbG9yTWFyay4uLicpO1xuXG4gIGNvbnN0IHhTY2FsZSA9IHNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKGV4dGVudChkYXRhLCB4VmFsdWUpKVxuICAgIC5yYW5nZShbMCwgaGFsZldpZHRoXSlcbiAgICAubmljZSgpO1xuXG4gIGNvbnN0IHlTY2FsZSA9IHNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKGV4dGVudChkYXRhLCB5VmFsdWUpKVxuICAgIC5yYW5nZShbaGFsZkhlaWdodCwgMF0pO1xuXG4gIC8vIGNvbnNvbGUubG9nKGV4dGVudChkYXRhLCB4VmFsdWUpKTtcbiAgLy8gY29uc29sZS5sb2coZXh0ZW50KGRhdGEsIHlWYWx1ZSkpO1xuICAvLyBjb25zb2xlLmxvZyhleHRlbnQoZGF0YSwgY29sb3JWYWx1ZSkpO1xuICAvLyBjb25zb2xlLmxvZyhleHRlbnQoZGF0YSwgc2l6ZVZhbHVlKSk7XG5cbiAgY29uc3Qgc2l6ZVNjYWxlID0gc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oZXh0ZW50KGRhdGEsIHNpemVWYWx1ZSkpXG4gICAgLnJhbmdlKFsxLjEsIDguOF0pO1xuXG4gIGNvbnN0IGNvbG9yTmV3RG9tYWluID0gY29sb3JEb21haW5cbiAgICA/IGNvbG9yRG9tYWluLm1hcChjb2xvclZhbHVlKVxuICAgIDogZGF0YS5tYXAoY29sb3JWYWx1ZSkucmV2ZXJzZSgpO1xuICAvLyAgY29sb3JOZXdEb21haW4ucmV2ZXJzZSgpO1xuICAvL2NvbnNvbGUubG9nKGNvbG9yTmV3RG9tYWluKTtcbiAgY29uc3QgY29sb3JTY2FsZSA9IHNjYWxlT3JkaW5hbCgpXG4gICAgLmRvbWFpbihjb2xvck5ld0RvbWFpbilcbiAgICAucmFuZ2UoZ3JvdXBDb2xvckRlZnMpO1xuXG4gIC8vY29uc29sZS5sb2coY29sb3JTY2FsZS5kb21haW4oKSk7XG4gIC8vY29uc29sZS5sb2coY29sb3JTY2FsZS5yYW5nZSgpKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8QXhpc0JvdHRvbVxuICAgICAgICB4U2NhbGU9e3hTY2FsZX1cbiAgICAgICAgaW5uZXJIZWlnaHQ9e2hhbGZIZWlnaHR9XG4gICAgICAgIHRpY2tGb3JtYXQ9e3hBeGlzVGlja0Zvcm1hdH1cbiAgICAgICAgdGlja09mZnNldD17NX1cbiAgICAgIC8+XG4gICAgICA8dGV4dFxuICAgICAgICBjbGFzc05hbWU9XCJheGlzLWxhYmVsXCJcbiAgICAgICAgdGV4dEFuY2hvcj1cIm1pZGRsZVwiXG4gICAgICAgIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgkey15QXhpc0xhYmVsT2Zmc2V0fSwke2hhbGZIZWlnaHQgL1xuICAgICAgICAgIDJ9KSByb3RhdGUoLTkwKWB9XG4gICAgICA+XG4gICAgICAgIHt5QXhpc0xhYmVsfVxuICAgICAgPC90ZXh0PlxuICAgICAgPEF4aXNMZWZ0IHlTY2FsZT17eVNjYWxlfSBpbm5lcldpZHRoPXtoYWxmV2lkdGh9IHRpY2tPZmZzZXQ9ezV9IC8+XG4gICAgICA8dGV4dFxuICAgICAgICBjbGFzc05hbWU9XCJheGlzLWxhYmVsXCJcbiAgICAgICAgeD17aGFsZldpZHRoIC8gMn1cbiAgICAgICAgeT17aGFsZkhlaWdodCArIHhBeGlzTGFiZWxPZmZzZXR9XG4gICAgICAgIHRleHRBbmNob3I9XCJtaWRkbGVcIlxuICAgICAgPlxuICAgICAgICB7eEF4aXNMYWJlbH1cbiAgICAgIDwvdGV4dD5cbiAgICAgIDxnIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgke2xlZ2VuZE9mZnNldFh9LCAke2xlZ2VuZE9mZnNldFl9KWB9PlxuICAgICAgICA8dGV4dCB4PXsxNX0geT17LTE1fSBjbGFzc05hbWU9XCJheGlzLWxhYmVsXCIgdGV4dEFuY2hvcj1cIm1pZGRsZVwiPlxuICAgICAgICAgIHtjb2xvckxlZ2VuZExhYmVsfVxuICAgICAgICA8L3RleHQ+XG4gICAgICAgIDxDb2xvckxlZ2VuZFxuICAgICAgICAgIHRpY2tTcGFjaW5nPXsxNH1cbiAgICAgICAgICB0aWNrVGV4dE9mZnNldD17MTJ9XG4gICAgICAgICAgY29sb3JTY2FsZT17Y29sb3JTY2FsZX1cbiAgICAgICAgICBvbkNsaWNrPXtzZXRTZWxlY3RlZFZhbHVlfVxuICAgICAgICAgIHNlbGVjdGVkVmFsdWU9e3NlbGVjdGVkVmFsdWV9XG4gICAgICAgICAgb25Ib3Zlcj17c2V0SG92ZXJlZFZhbHVlfVxuICAgICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFZhbHVlfVxuICAgICAgICAgIGhvdmVyT3BhY2l0eT17aG92ZXJPcGFjaXR5fVxuICAgICAgICAgIGZhZGVPcGFjaXR5PXtmYWRlT3BhY2l0eX1cbiAgICAgICAgLz5cbiAgICAgIDwvZz5cbiAgICAgIDxDdXJ2ZU1hcmtzXG4gICAgICAgIGRhdGE9e2RhdGF9XG4gICAgICAgIHhTY2FsZT17eFNjYWxlfVxuICAgICAgICB5U2NhbGU9e3lTY2FsZX1cbiAgICAgICAgeFZhbHVlPXt4VmFsdWV9XG4gICAgICAgIHlWYWx1ZT17eVZhbHVlfVxuICAgICAgICBjbHJTY2FsZT17Y29sb3JTY2FsZX1cbiAgICAgICAgY2xyVmFsdWU9e2NvbG9yVmFsdWV9XG4gICAgICAgIHNpemVTY2FsZT17c2l6ZVNjYWxlfVxuICAgICAgICBjaXJjbGVSYWRpdXM9e3NpemVWYWx1ZX1cbiAgICAgICAgdG9vbHRpcEZvcm1hdD17eEF4aXNUaWNrRm9ybWF0fVxuICAgICAgICB0dHBWYWx1ZT17dG9vbHRpcFZhbHVlfVxuICAgICAgICBvbkNsaWNrPXtzZXRTZWxlY3RlZFZhbHVlfVxuICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RlZFZhbHVlfVxuICAgICAgICBvbkhvdmVyPXtzZXRIb3ZlcmVkVmFsdWV9XG4gICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFZhbHVlfVxuICAgICAgICBob3Zlck9wYWNpdHk9e2hvdmVyT3BhY2l0eX1cbiAgICAgICAgZmFkZU9wYWNpdHk9e2ZhZGVPcGFjaXR5fVxuICAgICAgLz5cbiAgICA8Lz5cbiAgKTtcbn07XG4iLCJpbXBvcnQge1xuICBnZXRMYWJlbCxcbiAgVmFsdWVBdHRyaWJ1dGVzLFxuICBGaWVsZEF0dHJpYnV0ZXMsXG4gIE51bU9mU3RhdGVzLFxuICBHcm91cDVDb2xvcixcbiAgR3JvdXAxMENvbG9yXG59IGZyb20gJy4vQ29tbW9uL0F0dHJpYnV0ZXNEZWZzJztcbmltcG9ydCB7IGZvcm1hdCwgem9vbSB9IGZyb20gJ2QzJztcbmltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlTWVtbyB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IFJlYWN0RHJvcGRvd24gZnJvbSAncmVhY3QtZHJvcGRvd24nO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgdXNlRGF0YSwgdXNlRGF0YU9ubHlPbmNlIH0gZnJvbSAnLi9EYXRhL3VzZURhdGEnO1xuaW1wb3J0IHsgZ2V0VXNBdGxhcyB9IGZyb20gJy4vRGF0YS9nZXRVc0F0bGFzJztcbmltcG9ydCB7IGdldFN1bURhdGEgfSBmcm9tICcuL0RhdGEvc3VtRGF0YUJ5WWVhcic7XG5pbXBvcnQgeyBnZXRUb3BOU3RhdGVEYXRhIH0gZnJvbSAnLi9EYXRhL3N1bURhdGEnO1xuaW1wb3J0IHtcbiAgZ2V0RmlsdGVyZWREYXRhLFxuICBnZXRTdGF0ZTJWYWx1ZU1hcCxcbiAgZ2V0VG9wTlN0YXRlc0ZsYWdcbn0gZnJvbSAnLi9EYXRhL0ZpbHRlckRhdGEnO1xuaW1wb3J0IHsgZ2V0U3VtRGF0YTIsIGdldFN1bURhdGFBbGwgfSBmcm9tICcuL0RhdGEvc3VtRGF0YUJ5U3RhdGUnO1xuaW1wb3J0IHsgQmFyQ29sb3JNYXJrIH0gZnJvbSAnLi9CYXJDb2xvck1hcmsvQmFyLWluZGV4LmpzJztcbmltcG9ydCB7IE1hcENvbG9yTWFyayB9IGZyb20gJy4vTWFwQ29sb3JNYXJrL01hcC1pbmRleC5qcyc7XG5pbXBvcnQgeyBMaW5lQ29sb3JNYXJrIH0gZnJvbSAnLi9MaW5lQ29sb3JNYXJrL0xpbmUtaW5kZXguanMnO1xuXG4vL1BhcnQgSTogR2xvYmFsIHZhbHVlc1xuY29uc3Qgd2lkdGggPSA5NjA7XG5jb25zdCBtZW51SGVpZ2h0ID0gNjA7XG5jb25zdCBoZWlnaHQgPSA1MDAgLSBtZW51SGVpZ2h0O1xuY29uc3QgbWFyZ2luID0geyB0b3A6IDEwLCByaWdodDogMzAsIGJvdHRvbTogNjUsIGxlZnQ6IDkwIH07XG5jb25zdCB4QXhpc0xhYmVsT2Zmc2V0ID0gMzA7XG5jb25zdCB5QXhpc0xhYmVsT2Zmc2V0ID0gNTA7XG5jb25zdCBpbm5lckhlaWdodCA9IGhlaWdodCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuY29uc3QgaW5uZXJXaWR0aCA9IHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQ7XG5jb25zdCBoYWxmV2lkdGggPSAoaW5uZXJXaWR0aCAtIDIwKSAvIDI7XG5jb25zdCBoYWxmSGVpZ2h0ID0gKGlubmVySGVpZ2h0IC0gMjApIC8gMjtcbmNvbnN0IGhhbGZNYXJnaW5YID0gMzA7XG5jb25zdCBoYWxmTWFyZ2luWSA9IDQwO1xuY29uc3QgbGVmdE1hcmdpblggPSAxNDA7XG4vL0ludGVyYWN0aW9uIHJlbGF0ZWRcbmNvbnN0IGZhZGVPcGFjaXR5ID0gMC4yO1xuY29uc3Qgbm9ybWFsT3BhY2l0eSA9IDAuODtcbmNvbnN0IGhpZ2hsaWdodE9wYWNpdHkgPSAwLjk2O1xuXG4vL1BhcnQgSUk6IE1haW4gZnVuY3Rpb25kXG5jb25zdCBBcHAgPSAoKSA9PiB7XG4gIGNvbnN0IFtob3ZlcmVkWWVhclZhbHVlLCBzZXRIb3ZlcmVkWWVhclZhbHVlXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbaG92ZXJlZFN0YXRlVmFsdWUsIHNldEhvdmVyZWRTdGF0ZVZhbHVlXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbc2VsZWN0WWVhclZhbHVlLCBzZXRTZWxlY3RlZFllYXJWYWx1ZV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW3NlbGVjdFN0YXRlVmFsdWUsIHNldFNlbGVjdGVkU3RhdGVWYWx1ZV0gPSB1c2VTdGF0ZShudWxsKTtcblxuICBjb25zdCBoYW5kbGVSZXNldEJ1dHRvbkNsaWNrID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldFNlbGVjdGVkWWVhclZhbHVlKG51bGwpO1xuICAgIHNldFNlbGVjdGVkU3RhdGVWYWx1ZShudWxsKTtcbiAgICBjb25zb2xlLmxvZygnVGhlIHJlc2V0IGJ1dHRvbiBpcyBjbGlja2VkLicpO1xuICB9O1xuXG4gIC8vU3RlcCAwOiBNZW51IHdpdGggYXR0cmlidXRlIHNlbGVjdGlvbnNcbiAgLy94VmFsdWUgYW5kIHlWYWx1ZXMgYXJlIGRlZmluZWQgaGVyZVxuICBjb25zdCBpbml0aWFsWEF0dHJpYnV0ZSA9ICdXZWVrJztcbiAgY29uc3QgW3hBdHRyaWJ1dGUsIHNldFhBdHRyaWJ1dGVdID0gdXNlU3RhdGUoaW5pdGlhbFhBdHRyaWJ1dGUpO1xuICBjb25zdCB4VmFsdWUgPSBkID0+IGRbeEF0dHJpYnV0ZV07XG4gIC8vICB4TGFiZWwgaXMgZml4ZWQgZm9yIFhcbiAgY29uc3QgeEF4aXNMYWJlbCA9IGdldExhYmVsKHhBdHRyaWJ1dGUsIEZpZWxkQXR0cmlidXRlcyk7XG5cbiAgY29uc3QgaW5pdGlhbFlBdHRyaWJ1dGUgPSAnSUxJX1BlcmNlbnQnO1xuICBjb25zdCBbeUF0dHJpYnV0ZSwgc2V0WUF0dHJpYnV0ZV0gPSB1c2VTdGF0ZShpbml0aWFsWUF0dHJpYnV0ZSk7XG4gIGNvbnN0IHlWYWx1ZSA9IGQgPT4gZFt5QXR0cmlidXRlXTtcbiAgY29uc3QgeUF4aXNMYWJlbCA9IGdldExhYmVsKHlBdHRyaWJ1dGUsIFZhbHVlQXR0cmlidXRlcyk7XG5cbiAgY29uc3QgaW5pdGlhbE51bVN0YXRlID0gJzEwJztcbiAgY29uc3QgW3RvcFN0YXRlTnVtLCBzZXRUb3BTdGF0ZU51bV0gPSB1c2VTdGF0ZShpbml0aWFsTnVtU3RhdGUpO1xuXG4gIC8vICBjb25zdCBkYXRhID0gdXNlRGF0YSgpO1xuICBjb25zdCBkYXRhID0gdXNlRGF0YSgpO1xuICBjb25zdCB1c0F0bGFzID0gZ2V0VXNBdGxhcygpO1xuXG4gIGlmICghZGF0YSB8fCAhdXNBdGxhcykge1xuICAgIHJldHVybiA8cHJlPkxvYWRpbmcuLi48L3ByZT47XG4gIH1cbiAgY29uc29sZS5sb2coJ0RhdGEgbG9hZGluZyBpcyBkb25lLicpO1xuXG4gIGNvbnN0IHNpRm9ybWF0MiA9IGZvcm1hdCgnNGQnKTtcbiAgLy9jb25zdCBzaUZvcm1hdDEgPSBmb3JtYXQoJy4yZycpO1xuICBjb25zdCBzaUZvcm1hdCA9IGZvcm1hdCgnLjJzJyk7XG4gIGNvbnN0IHhBeGlzVGlja0Zvcm1hdCA9IHRpY2tWYWx1ZSA9PiBzaUZvcm1hdCh0aWNrVmFsdWUpLnJlcGxhY2UoJ0cnLCAnQicpO1xuICBjb25zdCB4QXhpc1RpY2tGb3JtYXRZZWFyID0gdGlja1ZhbHVlID0+XG4gICAgc2lGb3JtYXQyKHRpY2tWYWx1ZSkucmVwbGFjZSgnRycsICdCJyk7XG5cbiAgLy9ob3Zlck9wYWNpdHkgdmFsdWUgZGVmaW5pdGlvbnNcbiAgY29uc3QgaG92ZXJPcGFjaXR5WWVhciA9XG4gICAgaG92ZXJlZFllYXJWYWx1ZSAhPT0gbnVsbCA/IGhpZ2hsaWdodE9wYWNpdHkgOiBub3JtYWxPcGFjaXR5O1xuICBjb25zdCBmYWRlT3JOb3JtYWxPcGFjaXR5WWVhciA9XG4gICAgaG92ZXJlZFllYXJWYWx1ZSAhPT0gbnVsbCA/IGZhZGVPcGFjaXR5IDogbm9ybWFsT3BhY2l0eTtcbiAgY29uc3QgaG92ZXJPcGFjaXR5U3RhdGUgPVxuICAgIGhvdmVyZWRTdGF0ZVZhbHVlICE9PSBudWxsID8gaGlnaGxpZ2h0T3BhY2l0eSA6IG5vcm1hbE9wYWNpdHk7XG4gIGNvbnN0IGZhZGVPck5vcm1hbE9wYWNpdHlTdGF0ZSA9XG4gICAgaG92ZXJlZFN0YXRlVmFsdWUgIT09IG51bGwgPyBmYWRlT3BhY2l0eSA6IG5vcm1hbE9wYWNpdHk7XG5cbiAgLy9TdGVwIDE6IERlcml2ZWQgZGF0YSBmcm9tIGhlcmUgZm9yIHBsb3Q6NC0xIExpbmUgY2hhcnRcbiAgLy9Nb3ZlIGludG8gTGluZUNvbG9yTWFya1xuICBjb25zdCBjb2xvclZhbHVlID0gZCA9PiBkLlllYXI7XG4gIGNvbnN0IHNpemVWYWx1ZSA9IGQgPT4gZC5JTElfVG90YWw7XG4gIGNvbnN0IHRvb2x0aXBWYWx1ZSA9IGQgPT4gZC5JTElfVG90YWw7XG4gIGNvbnN0IGNvbG9yMm5kVmFsdWUgPSBkID0+IGQuU3RhdGU7XG5cbiAgLy9jb25zdCBzdW1EYXRhQnlZZWFyID0gdXNlTWVtbygoKSA9PiAoZ2V0U3VtRGF0YShkYXRhLCB5VmFsdWUpKSwgW2RhdGEsIHlWYWx1ZV0pO1xuICBjb25zdCBzdW1EYXRhQnlZZWFyID0gZ2V0U3VtRGF0YShkYXRhLCB5VmFsdWUpO1xuICAvLyAgY29uc29sZS5sb2coc3VtRGF0YUJ5WWVhcik7XG4gIC8vY29uc29sZS5sb2coJ0NhbGxlZCBzdW1EYXRhIGJ5IHllYXIuJyk7XG5cbiAgLy9TdGVwIDI6IFVTIG1hcCBmb3IgYWxsIHN0YXRlcyBwbG90OiA0LTJcbiAgY29uc3QgeWVhcklkID0gaG92ZXJlZFllYXJWYWx1ZSAhPT0gbnVsbCA/IGhvdmVyZWRZZWFyVmFsdWUgOiBzZWxlY3RZZWFyVmFsdWU7XG4gIC8vICBjb25zb2xlLmxvZygnLS0tLS0tIEhvdmVyIG9yIHNlbGVjdGlvbiB5ZWFyOiAnLCB5ZWFySWQpO1xuXG4gIGNvbnN0IGZpbHRlcmVkRGF0YUFsbCA9IGdldEZpbHRlcmVkRGF0YShkYXRhLCBudWxsKTtcbiAgY29uc3QgZmlsdGVyZWREYXRhID0gZ2V0RmlsdGVyZWREYXRhKGRhdGEsIHllYXJJZCk7XG4gIC8vICBjb25zb2xlLmxvZyhmaWx0ZXJlZERhdGEpO1xuICBjb25zdCBzdW1EYXRhQWxsU3RhdGUgPSBnZXRTdW1EYXRhQWxsKGZpbHRlcmVkRGF0YSwgeVZhbHVlLCBjb2xvcjJuZFZhbHVlKTtcbiAgY29uc3Qgc3RhdGVUb1ZhbHVlID0gZCA9PiBkLmF2ZztcbiAgY29uc3Qgc3RhdGUyVmFsdWVNYXAgPSBnZXRTdGF0ZTJWYWx1ZU1hcChzdW1EYXRhQWxsU3RhdGUsIHN0YXRlVG9WYWx1ZSk7XG4gIC8vICBjb25zb2xlLmxvZyhzdGF0ZTJWYWx1ZU1hcCk7XG5cbiAgLy9TdGVwIDM6IERlcml2ZWQgZGF0YSBmcm9tIGhlcmUgZm9yIHBsb3Q6IDQtMyBCYXIgY2hhcnRcbiAgY29uc3QgdG9wTlN0YXRlc0RhdGEgPSBnZXRUb3BOU3RhdGVEYXRhKGZpbHRlcmVkRGF0YSwgeVZhbHVlLCB0b3BTdGF0ZU51bSk7XG4gIC8vICBjb25zb2xlLmxvZyh0b3BOU3RhdGVzRGF0YSk7XG4gIC8vY29uc29sZS5sb2coJ0NhbGxlZCBnZXRUb3BOU3RhdGVEYXRhIGJ5IHllYXIuJyk7XG5cbiAgY29uc3QgeUJhclZhbHVlID0gZCA9PiBkLlN0YXRlO1xuICBjb25zdCB4QmFyVmFsdWUgPSBkID0+IGQuVHZhbHVlO1xuXG4gIC8vU3RlcCA0OiBEZXJpdmVkIGxpbmUgcGxvdDogNC00IEN1cnZlIGNoYXJ0XG4gIGNvbnN0IHRvcDEwU3RhdGVzID0gZ2V0VG9wTlN0YXRlc0ZsYWcoZmlsdGVyZWREYXRhQWxsLCB0b3BOU3RhdGVzRGF0YSk7XG4gIC8vICBjb25zb2xlLmxvZyh0b3AxMFN0YXRlcyk7XG4gIGNvbnN0IHN1bURhdGExMFN0YXRlID0gZ2V0U3VtRGF0YTIodG9wMTBTdGF0ZXMsIHlWYWx1ZSwgY29sb3IybmRWYWx1ZSk7XG4gIC8vICBjb25zb2xlLmxvZyhzdW1EYXRhMTBTdGF0ZSk7XG4gIC8vY29uc29sZS5sb2coJ0NhbGxlZCBnZXRTdW1EYXRhMiBieSBzdGF0ZS4nKTtcblxuICAvL1N0ZXAgNTogRHJhdyBwbG90cyB1c2luZyBzdmcsIG90aGVyIGNvbnRyb2xzOiBSZWFjdERyb3Bkb3duXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWVudXMtY29udGFpbmVyXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImRyb3Bkb3duLWxhYmVsXCI+Q2hvb3NlIGEgZGF0YSBmaWVsZDo8L3NwYW4+XG4gICAgICAgIDxSZWFjdERyb3Bkb3duXG4gICAgICAgICAgb3B0aW9ucz17VmFsdWVBdHRyaWJ1dGVzfVxuICAgICAgICAgIHZhbHVlPXt5QXR0cmlidXRlfVxuICAgICAgICAgIG9uQ2hhbmdlPXsoeyB2YWx1ZSB9KSA9PiBzZXRZQXR0cmlidXRlKHZhbHVlKX1cbiAgICAgICAgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZHJvcGRvd24tbGFiZWxcIj4gPC9zcGFuPlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ1dHRvblwiIG9uQ2xpY2s9e2hhbmRsZVJlc2V0QnV0dG9uQ2xpY2t9PlxuICAgICAgICAgIHsnICd9XG4gICAgICAgICAgUmVzZXR7JyAnfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZHJvcGRvd24tbGFiZWxcIj5Ub3AgTiBTdGF0ZXM6PC9zcGFuPlxuICAgICAgICA8UmVhY3REcm9wZG93blxuICAgICAgICAgIG9wdGlvbnM9e051bU9mU3RhdGVzfVxuICAgICAgICAgIHZhbHVlPXt0b3BTdGF0ZU51bX1cbiAgICAgICAgICBvbkNoYW5nZT17KHsgdmFsdWUgfSkgPT4gc2V0VG9wU3RhdGVOdW0odmFsdWUpfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3ZnIHdpZHRoPXt3aWR0aH0gaGVpZ2h0PXtoZWlnaHR9PlxuICAgICAgICA8Z1xuICAgICAgICAgIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgke21hcmdpbi5sZWZ0ICsgaGFsZldpZHRoICsgaGFsZk1hcmdpblh9LCR7XG4gICAgICAgICAgICBtYXJnaW4udG9wXG4gICAgICAgICAgfSkgc2NhbGUoMC45OTUgMC45OTUpYH1cbiAgICAgICAgPlxuICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgIHdpZHRoPXtoYWxmV2lkdGh9XG4gICAgICAgICAgICBoZWlnaHQ9e2hhbGZIZWlnaHQgKyAyMH1cbiAgICAgICAgICAgIHZpZXdCb3g9e2AwIDAgJHt3aWR0aH0gJHtoZWlnaHQgKyA2MH1gfVxuICAgICAgICAgICAgem9vbUFuZFBhbj17J3pvb21BbmRQYW4nfVxuICAgICAgICAgICAgem9vbT17em9vbSgpLm9uKCd6b29tJywgKCkgPT4ge1xuICAgICAgICAgICAgICBnLmF0dHIoJ3RyYW5zZm9ybScsIGV2ZW50LnRyYW5zZm9ybSk7XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8TWFwQ29sb3JNYXJrXG4gICAgICAgICAgICAgIGRhdGE9e3N1bURhdGFBbGxTdGF0ZX1cbiAgICAgICAgICAgICAgYXRsYXM9e3VzQXRsYXN9XG4gICAgICAgICAgICAgIGF2Z1ZhbHVlPXtzdGF0ZVRvVmFsdWV9XG4gICAgICAgICAgICAgIHRvcFN0YXRlcz17dG9wTlN0YXRlc0RhdGF9XG4gICAgICAgICAgICAgIGNvbG9yVmFsdWU9e2NvbG9yMm5kVmFsdWV9XG4gICAgICAgICAgICAgIGlubmVyV2lkdGg9e2hhbGZXaWR0aH1cbiAgICAgICAgICAgICAgaW5uZXJIZWlnaHQ9e2hhbGZIZWlnaHR9XG4gICAgICAgICAgICAgIHRvb2x0aXBWYWx1ZT17eUJhclZhbHVlfVxuICAgICAgICAgICAgICB0b29sdGlwRm9ybWF0PXt4QXhpc1RpY2tGb3JtYXR9XG4gICAgICAgICAgICAgIHNldFNlbGVjdGVkVmFsdWU9e3NldFNlbGVjdGVkU3RhdGVWYWx1ZX1cbiAgICAgICAgICAgICAgc2VsZWN0ZWRWYWx1ZT17c2VsZWN0U3RhdGVWYWx1ZX1cbiAgICAgICAgICAgICAgc2V0SG92ZXJlZFZhbHVlPXtzZXRIb3ZlcmVkU3RhdGVWYWx1ZX1cbiAgICAgICAgICAgICAgaG92ZXJlZFZhbHVlPXtob3ZlcmVkU3RhdGVWYWx1ZX1cbiAgICAgICAgICAgICAgaG92ZXJPcGFjaXR5PXsnMC40NSd9XG4gICAgICAgICAgICAgIGZhZGVPcGFjaXR5PXsnMS4wJ31cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9zdmc+XG4gICAgICAgIDwvZz5cbiAgICAgICAgPGdcbiAgICAgICAgICB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoJHttYXJnaW4ubGVmdCArIDV9LCR7bWFyZ2luLnRvcCArXG4gICAgICAgICAgICBoYWxmSGVpZ2h0ICtcbiAgICAgICAgICAgIGhhbGZNYXJnaW5ZfSlgfVxuICAgICAgICA+XG4gICAgICAgICAgPEJhckNvbG9yTWFya1xuICAgICAgICAgICAgZGF0YT17dG9wTlN0YXRlc0RhdGF9XG4gICAgICAgICAgICB4VmFsdWU9e3hCYXJWYWx1ZX1cbiAgICAgICAgICAgIHlWYWx1ZT17eUJhclZhbHVlfVxuICAgICAgICAgICAgY29sb3JWYWx1ZT17Y29sb3IybmRWYWx1ZX1cbiAgICAgICAgICAgIHRvcFN0YXRlcz17dG9wTlN0YXRlc0RhdGF9XG4gICAgICAgICAgICBncm91cENvbG9yRGVmcz17R3JvdXAxMENvbG9yfVxuICAgICAgICAgICAgaW5uZXJXaWR0aD17aGFsZldpZHRofVxuICAgICAgICAgICAgaW5uZXJIZWlnaHQ9e2hhbGZIZWlnaHR9XG4gICAgICAgICAgICB4QXhpc0xhYmVsPXt5QXhpc0xhYmVsfVxuICAgICAgICAgICAgeEF4aXNUaWNrRm9ybWF0PXt4QXhpc1RpY2tGb3JtYXR9XG4gICAgICAgICAgICBzZXRTZWxlY3RlZFZhbHVlPXtzZXRTZWxlY3RlZFN0YXRlVmFsdWV9XG4gICAgICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RTdGF0ZVZhbHVlfVxuICAgICAgICAgICAgc2V0SG92ZXJlZFZhbHVlPXtzZXRIb3ZlcmVkU3RhdGVWYWx1ZX1cbiAgICAgICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFN0YXRlVmFsdWV9XG4gICAgICAgICAgICBob3Zlck9wYWNpdHk9e25vcm1hbE9wYWNpdHl9XG4gICAgICAgICAgICBmYWRlT3BhY2l0eT17ZmFkZU9yTm9ybWFsT3BhY2l0eVN0YXRlfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZz5cbiAgICAgICAgPGcgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKCR7bWFyZ2luLmxlZnR9LCR7bWFyZ2luLnRvcH0pYH0+XG4gICAgICAgICAgPExpbmVDb2xvck1hcmtcbiAgICAgICAgICAgIGRhdGE9e3N1bURhdGFCeVllYXJ9XG4gICAgICAgICAgICB4VmFsdWU9e3hWYWx1ZX1cbiAgICAgICAgICAgIHlWYWx1ZT17eVZhbHVlfVxuICAgICAgICAgICAgc2l6ZVZhbHVlPXtzaXplVmFsdWV9XG4gICAgICAgICAgICBjb2xvclZhbHVlPXtjb2xvclZhbHVlfVxuICAgICAgICAgICAgZ3JvdXBDb2xvckRlZnM9e0dyb3VwNUNvbG9yfVxuICAgICAgICAgICAgaW5uZXJXaWR0aD17aGFsZldpZHRofVxuICAgICAgICAgICAgaW5uZXJIZWlnaHQ9e2hhbGZIZWlnaHR9XG4gICAgICAgICAgICB4QXhpc0xhYmVsPXt4QXhpc0xhYmVsfVxuICAgICAgICAgICAgeUF4aXNMYWJlbD17eUF4aXNMYWJlbH1cbiAgICAgICAgICAgIHhBeGlzVGlja0Zvcm1hdD17eEF4aXNUaWNrRm9ybWF0WWVhcn1cbiAgICAgICAgICAgIHRvb2x0aXBWYWx1ZT17dG9vbHRpcFZhbHVlfVxuICAgICAgICAgICAgc2V0U2VsZWN0ZWRWYWx1ZT17c2V0U2VsZWN0ZWRZZWFyVmFsdWV9XG4gICAgICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RZZWFyVmFsdWV9XG4gICAgICAgICAgICBzZXRIb3ZlcmVkVmFsdWU9e3NldEhvdmVyZWRZZWFyVmFsdWV9XG4gICAgICAgICAgICBob3ZlcmVkVmFsdWU9e2hvdmVyZWRZZWFyVmFsdWV9XG4gICAgICAgICAgICBob3Zlck9wYWNpdHk9e2hvdmVyT3BhY2l0eVllYXJ9XG4gICAgICAgICAgICBmYWRlT3BhY2l0eT17ZmFkZU9yTm9ybWFsT3BhY2l0eVllYXJ9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9nPlxuICAgICAgICA8Z1xuICAgICAgICAgIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgke21hcmdpbi5sZWZ0ICtcbiAgICAgICAgICAgIDIgK1xuICAgICAgICAgICAgaGFsZldpZHRoICtcbiAgICAgICAgICAgIGhhbGZNYXJnaW5YICtcbiAgICAgICAgICAgIGxlZnRNYXJnaW5YfSwke21hcmdpbi50b3AgKyBoYWxmSGVpZ2h0ICsgaGFsZk1hcmdpbll9KWB9XG4gICAgICAgID5cbiAgICAgICAgICA8TGluZUNvbG9yTWFya1xuICAgICAgICAgICAgZGF0YT17c3VtRGF0YTEwU3RhdGV9XG4gICAgICAgICAgICB4VmFsdWU9e2NvbG9yVmFsdWV9XG4gICAgICAgICAgICB5VmFsdWU9e3lWYWx1ZX1cbiAgICAgICAgICAgIHNpemVWYWx1ZT17c2l6ZVZhbHVlfVxuICAgICAgICAgICAgY29sb3JWYWx1ZT17Y29sb3IybmRWYWx1ZX1cbiAgICAgICAgICAgIGNvbG9yRG9tYWluPXt0b3BOU3RhdGVzRGF0YX1cbiAgICAgICAgICAgIGdyb3VwQ29sb3JEZWZzPXtHcm91cDEwQ29sb3J9XG4gICAgICAgICAgICBpbm5lcldpZHRoPXtoYWxmV2lkdGggLSBsZWZ0TWFyZ2luWH1cbiAgICAgICAgICAgIGlubmVySGVpZ2h0PXtoYWxmSGVpZ2h0fVxuICAgICAgICAgICAgbGVnZW5kT25MZWZ0PXsndHJ1ZSd9XG4gICAgICAgICAgICB4QXhpc0xhYmVsPXsnWWVhcid9XG4gICAgICAgICAgICB5QXhpc0xhYmVsPXt5QXhpc0xhYmVsfVxuICAgICAgICAgICAgeEF4aXNUaWNrRm9ybWF0PXt4QXhpc1RpY2tGb3JtYXRZZWFyfVxuICAgICAgICAgICAgdG9vbHRpcFZhbHVlPXt0b29sdGlwVmFsdWV9XG4gICAgICAgICAgICBzZXRTZWxlY3RlZFZhbHVlPXtzZXRTZWxlY3RlZFN0YXRlVmFsdWV9XG4gICAgICAgICAgICBzZWxlY3RlZFZhbHVlPXtzZWxlY3RTdGF0ZVZhbHVlfVxuICAgICAgICAgICAgc2V0SG92ZXJlZFZhbHVlPXtzZXRIb3ZlcmVkU3RhdGVWYWx1ZX1cbiAgICAgICAgICAgIGhvdmVyZWRWYWx1ZT17aG92ZXJlZFN0YXRlVmFsdWV9XG4gICAgICAgICAgICBob3Zlck9wYWNpdHk9e2hvdmVyT3BhY2l0eVN0YXRlfVxuICAgICAgICAgICAgZmFkZU9wYWNpdHk9e2ZhZGVPck5vcm1hbE9wYWNpdHlTdGF0ZX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L2c+XG4gICAgICA8L3N2Zz5cbiAgICA8Lz5cbiAgKTtcbn07XG5cbmNvbnN0IHJvb3RFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKTtcblJlYWN0RE9NLnJlbmRlcig8QXBwIC8+LCByb290RWxlbWVudCk7XG4iXSwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJjc3YiLCJqc29uIiwiZmVhdHVyZSIsIm1lc2giLCJkZXNjZW5kaW5nIiwic2NhbGVCYW5kIiwic2NhbGVMaW5lYXIiLCJtYXgiLCJzY2FsZU9yZGluYWwiLCJnZW9BbGJlcnNVc2EiLCJnZW9QYXRoIiwiZ2VvR3JhdGljdWxlIiwidXNlTWVtbyIsImV4dGVudCIsInNjYWxlU2VxdWVudGlhbCIsImludGVycG9sYXRlWWxPclJkIiwiaW50ZXJwb2xhdGVQdVJkIiwiQXhpc0xlZnQiLCJsaW5lIiwiY3VydmVDYXJkaW5hbCIsIlJlYWN0IiwiZm9ybWF0Iiwiem9vbSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztFQUFPLE1BQU0sZUFBZSxHQUFHO0lBQzdCLEVBQUUsS0FB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